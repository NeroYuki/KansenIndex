import argparse
import json
import os.path
import re
from pprint import pprint
import requests
# from AltasUnpacker import parse_atlas, extract_images

from icecream import ic

BASE_PATH = "https://cdn.g123-kantai.com/HatPuzzles/en/res"
SETTING_FILE = ''

SEARCH_PATTERN = ''

DRY_RUN = False

# MODE = 'skeleton'
MODE = 'texture'


class CocosSkeleton(object):
    name = None
    raw_data = None
    spine_skeleton = None
    atlas = None

    # processed values
    atlas_data = None
    textures = None

    def __init__(self, skeleton_url=None):
        response = requests.get(skeleton_url)
        self.raw_data = json.loads(response.text)
        with open('debug/debug.json', 'w') as f:
            f.write(json.dumps(self.raw_data))

        self.name = self.raw_data['_name']
        ic(f'dealing with {self.name}')

        self.textures = [{
            'name': self.raw_data['textureNames'][i],
            'uuid': self.raw_data['textures'][i]['__uuid__']
        } for i in range(len(self.raw_data['textureNames']))]

        ic(self.textures)
        self.spine_skeleton = self.raw_data['_skeletonJson']
        self.atlas = self.raw_data['_atlasText']

    def save_atlas(self):
        with open(self.__get_atlas_file_path(), 'w') as out_atlas:
            out_atlas.write(self.atlas)

    def save_spine_json(self):
        with open(f'extract/{self.name}.json', 'w') as out_spine:
            out_spine.write(json.dumps(self.spine_skeleton, indent=2))

    def process_textures(self):
        for texture in self.textures:
            decoded_uuid = decode_uuid(texture['uuid'])
            hash_dict = find_hash(texture['uuid'], json_data)
            url = build_url(decoded_uuid, hash_dict, 'png')
            req = requests.get(url)
            with open(f'extract/{texture["name"]}', 'wb') as t:
                t.write(req.content)

    # def process_atlas(self):
    #     if not os.path.exists(os.path.join('extract/', self.name)):
    #         os.mkdir(os.path.join('extract/', self.name))
    #     self.atlas_data = parse_atlas(self.__get_atlas_file_path())
    #     extract_images(self.atlas_data, 'extract/', os.path.join('extract/', self.name))

    @staticmethod
    def download_file(texture_path, url):
        ic(f'getting {url}')
        req = requests.get(url)
        dir_hier = os.path.dirname(texture_path)
        filename = os.path.basename(texture_path)
        if not os.path.exists(f'extract/{dir_hier}'):
            os.makedirs(f'extract/{dir_hier}', exist_ok=True)

        with open(f'extract/{os.path.join(dir_hier, filename)}', 'wb') as t:
            t.write(req.content)

    def __get_atlas_file_path(self):
        return f'extract/{self.name}.atlas.txt'


def load_json(file):
    with open(file, 'r') as f:
        j = json.loads(f.read())

        uuids = j["uuids"]
        md5addr_map = j["md5AssetsMap"]
        for i, md5addr in enumerate(md5addr_map):
            # print(f"md5addr {md5addr}")
            r = md5addr_map[md5addr]
            for n in range(0, len(r), 2):
                if isinstance(r[n], int):
                    r[n] = uuids[r[n]]

    return j


def charcodeat(string, index):
    if isinstance(string, str) and isinstance(index, int):
        return ord(string[index])
    else:
        raise Exception(f"Error: charcodeat takes a str and an int, received {type(string)} and {type(int)}.")


def decode_uuid(base64):
    base64_keys = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/='
    values = [64 for i in range(123)]

    for i in range(64):
        values[charcodeat(base64_keys, i)] = i

    base64_values = values

    hex_chars = ['0', '1', '2', '3', '4', '5', '6', '7', '8', '9', 'a', 'b', 'c', 'd', 'e', 'f']
    _t = ['', '', '', '']
    uuid_template = ['', '', '', '', '', '', '', '', '-', '', '', '', '', '-', '', '', '', '', '-', '', '', '', '', '-',
                     '', '', '', '', '', '', '', '', '', '', '', '']
    indices = [0, 1, 2, 3, 4, 5, 6, 7, 9, 10, 11, 12, 14, 15, 16, 17, 19, 20, 21, 22, 24, 25, 26, 27, 28, 29, 30, 31,
               32, 33, 34, 35]

    strs = base64.split('@')
    uuid = strs[0]
    if len(uuid) != 22:
        return base64

    uuid_template[0] = base64[0]
    uuid_template[1] = base64[1]
    j = 2
    for i in range(2, 22, 2):
        lhs = base64_values[charcodeat(base64, i)]
        rhs = base64_values[charcodeat(base64, i + 1)]
        uuid_template[indices[j]] = hex_chars[lhs >> 2]
        j += 1
        uuid_template[indices[j]] = hex_chars[((lhs & 3) << 2) | rhs >> 4]
        j += 1
        uuid_template[indices[j]] = hex_chars[rhs & 0xF]
        j += 1

    return base64.replace(uuid, ''.join(uuid_template))


def find_hash(uuid, json_data):
    table = 'import'
    try:
        u_index = json_data['md5AssetsMap']['import'].index(uuid)
        hash = json_data['md5AssetsMap']['import'][u_index + 1]
    except ValueError:
        try:
            u_index = json_data['md5AssetsMap']['raw-assets'].index(uuid)
            hash = json_data['md5AssetsMap']['raw-assets'][u_index + 1]
            table = 'raw-assets'
        except ValueError:
            raise Exception("hash not found")

    return {"hash": hash, "table": table}


def build_url(_decoded_uuid, _hash_dict, assets_type, base_path=BASE_PATH):
    folder = _decoded_uuid[:2]
    return f"{base_path}/{_hash_dict['table']}/{folder}/{_decoded_uuid}.{_hash_dict['hash']}.{assets_type}"


def get_skeleton_urls(filter, json_data):
    urls = []
    skels = [s for s in json_data['rawAssets']['assets'].items() if s[1][1] == 4 and f"{filter}" in s[1][0]]
    for skel in skels:
        ic(skel)
        skel_uuid = json_data['uuids'][int(skel[0])]
        decoded_uuid = decode_uuid(skel_uuid)
        hash_dict = find_hash(skel_uuid, json_data)
        urls.append(build_url(decoded_uuid, hash_dict, 'json'))

    return urls


def get_texture_urls(filter, json_data):
    urls = []
    texs = [s for s in json_data['rawAssets']['assets'].items() if s[1][1] == 1 and re.search(f"{filter}", s[1][0])]

    for tex in texs:
        ic(tex)
        tex_uuid = json_data['uuids'][int(tex[0])]
        ic(tex_uuid)
        decoded_uuid = decode_uuid(tex_uuid)
        hash_dict = find_hash(tex_uuid, json_data)
        urls.append({
            "name": tex[1][0],
            "uuid": tex_uuid,
            "url": build_url(decoded_uuid, hash_dict, 'jpg' if 'draw' in tex[1][0] else 'png', base_path=BASE_PATH)
        })
    return urls


if __name__ == '__main__':
    parser = argparse.ArgumentParser(description="Armada Girls assets extractor")
    parser.add_argument('-t', '--type', default='texture', choices=['texture', 'skeleton'])
    parser.add_argument('-j', '--json', required=True, help='json file from settings.*.js')
    parser.add_argument('-n', '--dry-run', action='store_true', help="only display found assets, do not download",
                        default=False)
    parser.add_argument('-s', '--search', type=str, help="match assets with this pattern")
    parser.add_argument('-f', '--force', action='store_true', help="force execution with empty search pattern",
                        default=False)
    # parser.add_argument('-d', '--destination', default='extract/')

    args = parser.parse_args()

    SETTING_FILE = args.json
    MODE = args.type
    DRY_RUN = args.dry_run
    SEARCH_PATTERN = args.search

    if (SEARCH_PATTERN == '' or SEARCH_PATTERN is None) and not args.force:
        print(
            """You have to use -f/--force when running with empty search pattern"""
            """or specify a search string with -s/--search""")
        exit(-1)

    json_data = load_json(SETTING_FILE)
    if MODE == 'skeleton':
        skels = get_skeleton_urls(SEARCH_PATTERN, json_data)
        pprint(skels)
        if DRY_RUN:
            exit()

        skel_obj = CocosSkeleton(skeleton_url=skels[0])
        skel_obj.save_atlas()
        skel_obj.save_spine_json()
        skel_obj.process_textures()
        # skel_obj.process_atlas()

    elif MODE == 'texture':
        texs = get_texture_urls(SEARCH_PATTERN, json_data)
        pprint(texs)
        if DRY_RUN:
            exit()

        for tex in texs:
            CocosSkeleton.download_file(tex['name'], tex['url'])
