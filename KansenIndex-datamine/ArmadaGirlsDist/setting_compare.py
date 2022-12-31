import json
import sys
from pprint import pprint


def compare(file_new, file_old):
    with open(file_new, 'r') as f:
        new = json.loads(f.read())

    with open(file_old, 'r') as f:
        old = json.loads(f.read())

    old_list = [i[0] for i in old['rawAssets']['assets'].values()]
    new_list = [i[0] for i in new['rawAssets']['assets'].values()]

    diff = list(set(old_list) ^ set(new_list))

    skeletons = [s for s in diff if '.json' in s]

    pprint(sorted(diff))
    # pprint(sorted(skeletons))


if __name__ == '__main__':
    compare(sys.argv[1], sys.argv[2])