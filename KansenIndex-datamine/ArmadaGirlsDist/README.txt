=== Setup ===
npm install
python -m venv venv
venv\Scripts\activate.bat
pip install icecream requests


=== Run ===
- Get the settings files.
- In a browser network inspector, search for 'settings'. This should yield only one result named: cms.settings.<HASH>.js
- Save the file.


- To extract JSON info from zipped JS file:
node js2json.js cms.settings.<HASH>.js


- To get assets
python CocosUuidDecode.py -s name_ifrit -j settings.<HASH>.json

Command Help:
python CocosUuidDecode.py -h
usage: CocosUuidDecode.py [-h] [-t {texture,skeleton}] -j JSON [-n] [-s SEARCH] [-f]

Armada Girls assets extractor

optional arguments:
  -h, --help            show this help message and exit
  -t {texture,skeleton}, --type {texture,skeleton}
  -j JSON, --json JSON  json file from settings.*.js
  -n, --dry-run         only display found assets, do not download
  -s SEARCH, --search SEARCH
                        match assets with this pattern
  -f, --force           force execution with empty search pattern