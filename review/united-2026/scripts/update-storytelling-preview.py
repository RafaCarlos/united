"""Apply only the requested phone video and storytelling card to the local home."""
from pathlib import Path
from hashlib import sha256
from lxml import html, etree

root = Path(__file__).resolve().parents[1]
dist = root / 'dist'
doc = html.document_fromstring((dist / 'index.html').read_text())
section = doc.xpath('//*[@id="live-class"]')[0]
video_box = section.xpath('.//div[@class="video-play"]')[0]
video_box.clear()
video_box.set('class', 'video-play')
heading = html.fromstring('<p class="character-phone-heading"><span>Storytelling</span>Histórias que envolvem.</p>')
video_box.append(heading)
video = etree.SubElement(video_box, 'video', {'controls':'','muted':'','loop':'','playsinline':'','preload':'none','data-managed-video':'','aria-label':'Personagens 3D da United conversando no zoológico','poster':'assets/images/united-characters-poster.jpg','width':'624','height':'720'})
etree.SubElement(video, 'source', src='assets/videos/united-characters-loop.mp4', type='video/mp4')
fallback = etree.SubElement(video, 'a', href='assets/videos/united-characters-loop.mp4')
fallback.text = 'Assistir ao vídeo dos personagens.'
etree.SubElement(video_box, 'p', {'class':'character-phone-caption'}).text = 'Inglês que acontece.'

items = section.xpath('.//div[@class="itens"]/div')
card = items[2]
card.set('class', 'item wow slideInRight storytelling-card')
card.set('id', 'storytelling')
image = card.find('./figure/img')
image.set('src', 'assets/images/storytelling-characters-3d.png')
image.set('alt', 'Personagens 3D da United conversando em Nova York')
image.set('width', '1672')
image.set('height', '941')
card.find('./div/h4').text = 'Storytelling'
card.find('./div/p').text = 'A cada aula, uma nova história. Personagens e situações do dia a dia dão contexto ao inglês que você aprende e pratica.'

name = 'storytelling-preview.css'
(dist / name).write_bytes((root / 'src' / name).read_bytes())
for old in doc.xpath('//link[contains(@href,"storytelling-preview.css")]'):
    old.getparent().remove(old)
etree.SubElement(doc.find('head'), 'link', rel='stylesheet', href=name+'?v='+sha256((dist/name).read_bytes()).hexdigest()[:12])
(dist/'index.html').write_text('<!DOCTYPE html>\n'+html.tostring(doc, encoding='unicode'))
print('Local home updated; no remote publication.')
