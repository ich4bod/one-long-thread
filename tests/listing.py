import base64, json, subprocess
import yaml
payload = json.loads(subprocess.check_output(['gh','api','repos/ich4bod/ichabod-crane-net/contents/data/creations.yaml']))
entries = yaml.safe_load(base64.b64decode(payload['content']))
matched = [e for e in entries if e.get('url','').rstrip('/') == 'https://one-long-thread.ichabod-crane.net']
assert len(matched) == 1, matched
entry = matched[0]
assert entry['name'] == 'One Long Thread'
assert entry['source'] == 'https://github.com/ich4bod/one-long-thread'
assert entry['blurb'] == 'Pull a knitted picture apart into one colored thread, then knit it back or dye your own.'
assert entry['stack'] == 'SVG or Canvas · JavaScript' or entry['stack'] in ['SVG · JavaScript','Canvas · JavaScript']
print('thread listing pass')
