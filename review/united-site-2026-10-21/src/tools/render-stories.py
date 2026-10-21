"""Render the five local Reach 4 chapters with a shared layout and original artwork."""
from pathlib import Path
import json
from html import escape as esc
ROOT=Path(__file__).resolve().parent.parent
stories=json.loads((ROOT/'tools/stories.json').read_text())
assets=[]
for name in ['historias-assets.json','historias-v26-assets.json','historias-paris-assets.json','historias-unicas-2026-10-21.json']:
    assets.extend(json.loads((ROOT/'evidence'/name).read_text()))
def scene(item,index):
    name,kicker,caption,alt,*framing=item
    variants=sorted([a for a in assets if a['asset'].rsplit('-',1)[0]=='assets/'+name],key=lambda x:x['width'])
    # Preserve the already approved opening scene's responsive sources.
    if name=='historia-restaurante' and index>0:
        variants=[a for a in variants if a['width']<=900]
    large=variants[-1]
    source_set=', '.join(f"{a['asset']} {a['width']}w" for a in variants)
    sizes='(max-width:780px) calc(100vw - 40px), '
    fraction='.608' if index==0 else '.392'
    sizes+=f'(max-width:1100px) calc((100vw - 88px)*{fraction}), (max-width:1240px) calc((100vw - 112px)*{fraction}), '+('686px' if index==0 else '442px')
    classes='story-scene'+(' story-scene-main' if index==0 else '')+(' story-scene-left' if framing else '')
    return f'''<figure class="{classes}"><img src="{large['asset']}" srcset="{source_set}" sizes="{sizes}" width="{large['width']}" height="{large['height']}" loading="lazy" decoding="async" alt="{esc(alt)}"><figcaption><span>{esc(kicker)}</span>{esc(caption)}</figcaption></figure>'''
tabs=[];panels=[]
for i,story in enumerate(stories):
    key=story['key'];selected=i==0
    tabs.append(f'''<button id="tab-{key}" role="tab" aria-selected="{str(selected).lower()}" tabindex="{0 if selected else -1}" aria-controls="story-panel-{key}" data-story="{key}">{i+1:02} <span>{esc(story['label'])}</span></button>''')
    scenes='\n'.join(scene(item,j) for j,item in enumerate(story['scenes']))
    tags=''.join('<span>'+esc(tag)+'</span>' for tag in story['skills'])
    panels.append(f'''<div class="story-panel" id="story-panel-{key}" data-story-panel="{key}" role="tabpanel" aria-labelledby="tab-{key}" tabindex="0"{'' if selected else ' hidden'}>
  <div class="story-mosaic">{scenes}</div>
  <div class="story-description"><div class="story-heading"><p class="eyebrow">{esc(story['unit'])}</p><h3>{esc(story['title'])}</h3></div><div class="story-detail"><p>{esc(story['text'])}</p><div class="skill-tags">{tags}</div></div></div>
</div>''')
output='<div class="story-tabs" role="tablist" aria-label="Exemplos do material Live Class">'+'\n'.join(tabs)+'</div>\n'+'\n'.join(panels)+'\n'
page=ROOT/'index.html';s=page.read_text();a=s.index('<div class="story-tabs"');b=s.index('<div class="method-line"',a)
page.write_text(s[:a]+output+s[b:])
print('Rendered five Reach 4 story mosaics.')
