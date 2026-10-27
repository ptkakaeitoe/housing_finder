#!/usr/bin/env python3
"""Generate HousingFinder's offline SVG + HTML system-model pack (stdlib only)."""
from pathlib import Path
from html import escape
import json
import textwrap

ROOT = Path(__file__).resolve().parent
INK, MUTED, LINE, ACCENT, SOFT = '#20242a', '#626b75', '#cbd1d7', '#a72f49', '#f5f6f7'

class SVG:
    def __init__(self, width, height, title, description):
        self.w, self.h = width, height
        self.parts = [f'<svg xmlns="http://www.w3.org/2000/svg" width="{width}" height="{height}" viewBox="0 0 {width} {height}" role="img" aria-labelledby="title desc"><title id="title">{escape(title)}</title><desc id="desc">{escape(description)}</desc>', '''<defs>
<marker id="arrow" markerWidth="10" markerHeight="10" refX="9" refY="5" orient="auto-start-reverse" markerUnits="userSpaceOnUse"><path d="M1 1 9 5 1 9" fill="none" stroke="#626b75" stroke-width="1.7"/></marker>
<marker id="triangle" markerWidth="13" markerHeight="13" refX="12" refY="6.5" orient="auto" markerUnits="userSpaceOnUse"><path d="M1 1 12 6.5 1 12Z" fill="white" stroke="#626b75" stroke-width="1.5"/></marker>
</defs>''', f'<rect width="{width}" height="{height}" fill="white"/>']
    def rect(self,x,y,w,h,fill='white',stroke=LINE,r=8,dash=False):
        self.parts.append(f'<rect x="{x}" y="{y}" width="{w}" height="{h}" rx="{r}" fill="{fill}" stroke="{stroke}" stroke-width="1.5"'+(' stroke-dasharray="6 5"' if dash else '')+'/>')
    def text(self,x,y,lines,size=20,weight=400,fill=INK,anchor='start',lineheight=None,underline=False):
        if isinstance(lines,str): lines=lines.split('\n')
        lh=lineheight or size*1.4
        self.parts.append(f'<text x="{x}" y="{y}" font-family="Arial, Helvetica, sans-serif" font-size="{size}" font-weight="{weight}" fill="{fill}" text-anchor="{anchor}"'+(' text-decoration="underline"' if underline else '')+'>')
        for i,line in enumerate(lines): self.parts.append(f'<tspan x="{x}" dy="{0 if i==0 else lh}">{escape(line)}</tspan>')
        self.parts.append('</text>')
    def path(self,points,arrow=False,dash=False,color=MUTED,width=1.7):
        d=' '.join(('M' if i==0 else 'L')+f'{x},{y}' for i,(x,y) in enumerate(points))
        self.parts.append(f'<path d="{d}" fill="none" stroke="{color}" stroke-width="{width}" stroke-linejoin="round"'+(' marker-end="url(#arrow)"' if arrow else '')+(' stroke-dasharray="7 5"' if dash else '')+'/>')
    def label(self,x,y,text,size=17,anchor='middle'):
        self.parts.append(f'<text x="{x}" y="{y}" font-family="Arial, Helvetica, sans-serif" font-size="{size}" fill="{MUTED}" text-anchor="{anchor}" style="paint-order:stroke;stroke:white;stroke-width:7;stroke-linejoin:round">{escape(text)}</text>')
    def circle(self,x,y,r,fill=INK,stroke=None):
        self.parts.append(f'<circle cx="{x}" cy="{y}" r="{r}" fill="{fill}" stroke="{stroke or fill}" stroke-width="2"/>')
    def ellipse(self,x,y,rx,ry,label):
        self.parts.append(f'<ellipse cx="{x}" cy="{y}" rx="{rx}" ry="{ry}" fill="white" stroke="{LINE}" stroke-width="1.7"/>')
        ls=label.split('\n'); self.text(x,y-(len(ls)-1)*13+7,ls,20,500,anchor='middle',lineheight=26)
    def box(self,x,y,w,h,title,lines=(),accent=False,size=20):
        self.rect(x,y,w,h,SOFT if accent else 'white')
        self.text(x+20,y+33,title,size,600,ACCENT if accent else INK)
        if lines: self.text(x+20,y+67,lines,18,fill=MUTED,lineheight=27)
    def actor(self,x,y,label):
        self.circle(x,y,15,'white',INK)
        self.path([(x,y+15),(x,y+60)],color=INK)
        self.path([(x-26,y+32),(x+26,y+32)],color=INK)
        self.path([(x,y+60),(x-23,y+88)],color=INK)
        self.path([(x,y+60),(x+23,y+88)],color=INK)
        self.text(x,y+117,label,19,600,anchor='middle')
    def diamond(self,x,y,w,h,label):
        self.parts.append(f'<path d="M{x},{y-h/2} {x+w/2},{y} {x},{y+h/2} {x-w/2},{y}Z" fill="white" stroke="{LINE}" stroke-width="1.7"/>')
        ls=label.split('\n');self.text(x,y-(len(ls)-1)*12+6,ls,18,500,anchor='middle',lineheight=24)
    def finish(self): return ''.join(self.parts)+'</svg>'

DIAGRAMS=[]
def add(slug,title,kind,summary,svg,notes,sources,portrait=False):
    xml=svg.finish(); (ROOT/f'{slug}.svg').write_text(xml)
    DIAGRAMS.append(dict(slug=slug,title=title,kind=kind,summary=summary,svg=xml,notes=notes,sources=sources,portrait=portrait))

# 1. Structure chart: functions and modules, not data flows.
s=SVG(1640,850,'HousingFinder — system functional structure','A hierarchical structure chart decomposing HousingFinder into five functional modules.')
s.box(570,35,500,105,'HousingFinder', ['Housing discovery and viewing coordination'],True,26)
s.path([(820,140),(820,195)]);s.path([(164,195),(1476,195)])
modules=[
 ('Account & access',['Registration and sign-in','Password recovery','Profile and preferences','Session and role access']),
 ('Discover & compare',['Search and filter homes','University and map browsing','Property details and trust','Monthly cost estimation']),
 ('Student workspace',['Save and unsave homes','Request a future viewing','Track viewing decisions']),
 ('Landlord workspace',['Create, edit and publish','Manage photos and costs','Accept or decline viewings','Submit identity documents']),
 ('Admin workspace',['Review landlord identity','Review property information','Moderate accounts/listings','Inspect viewing activity'])]
for i,(title,functions) in enumerate(modules):
    x=24+i*328;cx=x+140
    s.path([(cx,195),(cx,235)])
    s.box(x,235,280,76,title,accent=True,size=21)
    trunk=x+8
    s.path([(cx,311),(cx,330),(trunk,330),(trunk,386+(len(functions)-1)*87)])
    for j,function in enumerate(functions):
        y=350+j*87
        s.path([(trunk,y+36),(x+24,y+36)])
        s.rect(x+24,y,256,73,r=5)
        for k,line in enumerate(textwrap.wrap(function,25)): s.text(x+152,y+31+k*24,line,18,anchor='middle')
s.text(34,782,'Reading the chart',18,600)
s.text(34,815,'Lines show functional decomposition. They do not represent execution order, data flow, or class inheritance.',18,fill=MUTED)
add('01-structure-chart','System functional structure','Structure chart','Five modules organize the system’s functions and user workspaces.',s,[
 'Discovery is available without signing in. Protected workflows use authenticated sessions and database policies.',
 'Supporting services include Supabase Auth, PostgreSQL, Storage, Google Maps, and optional Cloud Translation.',
 'This is a logical function hierarchy. Shared functions can be called by more than one workspace.'
],['src/components/Navbar.jsx','src/views/SearchPage.jsx','src/views/LandlordDashboardPage.jsx','src/views/AdminDashboardPage.jsx','README.md'])

# 2. Level 1 DFD in Gane–Sarson notation, matching the supplied reference.
s=SVG(2000,2200,'HousingFinder — Level 1 data flow diagram','Five numbered processes connect external users and Google services with shared accounts, housing, saved-home, viewing, trust and file data stores. Yellow rectangles denote external entities; numbered rounded boxes denote processes; D-prefixed boxes denote data stores.')
s.text(40,38,'HousingFinder · Level 1 Data Flow Diagram',27,600)
YELLOW, BORDER = '#f6e89e', '#555b62'
def flow(points,label,x,y):
    s.path(points,True,color=BORDER,width=1.8)
    if label: s.label(x,y,label,18)
def process(x,y,number,title):
    s.rect(x,y,320,130,YELLOW,BORDER,r=18)
    s.rect(x,y+30,320,78,'white','none',r=0)
    s.path([(x,y+30),(x+320,y+30)],color=BORDER)
    s.path([(x,y+108),(x+320,y+108)],color=BORDER)
    s.path([(x+54,y),(x+54,y+30)],color=BORDER)
    s.text(x+27,y+22,number,18,600,anchor='middle')
    lines=title.split('\n');s.text(x+160,y+73-(len(lines)-1)*13,lines,23,500,anchor='middle',lineheight=27)
def external(x,y,w,identifier,title):
    s.rect(x,y,w,80,YELLOW,BORDER,r=0)
    s.text(x+w/2,y+27,identifier,15,fill=MUTED,anchor='middle')
    s.text(x+w/2,y+56,title,21,500,anchor='middle')
def data_store(x,y,w,identifier,title):
    s.rect(x,y,w,80,YELLOW,BORDER,r=0)
    s.rect(x,y,58,80,'#e4e4e4',BORDER,r=0)
    s.text(x+29,y+47,identifier,19,600,anchor='middle')
    s.text(x+58+(w-58)/2,y+47,title,20,500,anchor='middle')
# Directed, individually named data flows; line crossings are not junctions.
flow([(920,120),(920,180)],'Credentials / edits',806,154)
flow([(1080,180),(1080,120)],'Session / profile',1200,154)
flow([(1160,225),(1510,225)],'Account changes',1335,210)
flow([(1510,275),(1160,275)],'Identity / role / status',1335,302)
# Discovery and shared housing reference data.
flow([(320,500),(350,500),(350,690),(380,690)],'Search / filters',275,609)
flow([(380,750),(20,750),(20,520),(40,520)],'Homes / cost estimates',190,734)
flow([(845,560),(760,560),(760,690),(700,690)],'Published homes / campuses',760,623)
flow([(845,1050),(780,1050),(780,780),(700,780)],'Public photos',780,902)
flow([(600,790),(600,930),(120,930),(120,860)],'Coordinates / map query',355,913)
flow([(320,820),(540,820),(540,790)],'Map / geocoding data',441,849)
flow([(430,790),(430,960),(390,960),(390,1000)],'Saved listing IDs',498,983)
flow([(440,1040),(720,1040),(720,750),(700,750)],'Saved homes',570,1026)
# Landlord listing management, translation and photo storage.
flow([(1680,550),(1650,550),(1650,690),(1620,690)],'Property details / photos',1625,632)
flow([(1620,750),(1830,750),(1830,590)],'Saved listing',1780,735)
flow([(1400,660),(1400,560),(1155,560)],'Listing changes',1275,544)
flow([(1155,588),(1360,588),(1360,660)],'Listing records',1253,616)
flow([(1330,790),(1330,960),(1930,960),(1930,910)],'English title / description',1635,947)
flow([(1690,870),(1470,870),(1470,790)],'Translated text',1560,853)
flow([(1400,790),(1400,1050),(1155,1050)],'Photograph files',1278,1033)
flow([(1100,1010),(1100,975),(1250,975),(1250,725),(1300,725)],'Image paths',1245,902)
# Viewing requests and landlord responses.
flow([(320,1260),(350,1260),(350,1350),(380,1350)],'Viewing details',220,1310)
flow([(380,1420),(20,1420),(20,1275),(40,1275)],'Request status',197,1405)
flow([(845,590),(800,590),(800,1240),(750,1240),(750,1350),(700,1350)],'Listing / owner data',865,1205)
flow([(825,1640),(750,1640),(750,1400),(700,1400)],'Accept / decline decision',815,1496)
flow([(580,1450),(580,1560),(940,1560),(940,1600)],'Pending requests',760,1543)
flow([(450,1450),(450,1620),(370,1620),(370,1670)],'New / updated request',527,1605)
flow([(190,1670),(190,1500),(380,1500),(380,1450)],'Viewing records',295,1485)
# Verification and administration use the same persistent data stores.
flow([(1850,1280),(1850,1360),(1620,1360)],'Review / account decisions',1760,1335)
flow([(1620,1410),(1880,1410),(1880,1280)],'Queues / activity',1770,1395)
flow([(1155,1640),(1190,1640),(1190,1400),(1300,1400)],'Identity submission',1110,1517)
flow([(1300,1440),(1220,1440),(1220,1660),(1155,1660)],'Verification status',1320,1595)
flow([(1420,1320),(1420,1150),(1155,1150),(1155,1070)],'Private document upload',1295,1135)
flow([(1040,1090),(1040,1270),(1300,1270),(1300,1320)],'Authorized document data',1168,1253)
flow([(1520,1450),(1520,1690)],'Review outcome',1417,1615)
flow([(1710,1690),(1710,1570),(1580,1570),(1580,1450)],'Submissions / reviews',1730,1552)
flow([(1620,1395),(1980,1395),(1980,245),(1920,245)],'Account actions',1795,1372)
flow([(1920,280),(1968,280),(1968,1430),(1620,1430)],'Account records',1790,1456)
flow([(1380,1450),(1380,1860),(1080,1860),(1080,1910)],'Listing moderation',1230,1844)
flow([(950,1910),(950,1825),(1330,1825),(1330,1450)],'Listing records',1160,1812)
flow([(440,1710),(480,1710),(480,2050),(1360,2050),(1360,1450)],'Viewing activity',900,2034)
# All node symbols are drawn above the flows for clear text and boundaries.
external(840,40,320,'E1–E3','All users')
external(40,460,280,'E1','Visitor / student')
external(1680,510,280,'E2','Landlord')
external(40,780,280,'E4','Google Maps')
external(1690,830,270,'E5','Cloud Translation')
external(40,1220,280,'E1','Student')
external(825,1600,330,'E2','Landlord')
external(1690,1200,270,'E3','Admin')
process(840,180,'1.0','Manage accounts\nand access')
process(380,660,'2.0','Discover and\nsave homes')
process(1300,660,'3.0','Manage property\nlistings')
process(380,1320,'4.0','Coordinate\nviewing requests')
process(1300,1320,'5.0','Review and\nmoderate')
data_store(1510,205,410,'D1','Accounts / profiles')
data_store(845,520,310,'D2','Listings / campuses')
data_store(80,1000,360,'D3','Saved homes')
data_store(845,1010,310,'D6','File storage')
data_store(80,1670,360,'D4','Viewing requests')
data_store(1450,1690,450,'D5','Verification / listing reviews')
data_store(800,1910,340,'D2','Listings / campuses')
s.text(40,2130,'Rectangles: external entities   ·   Numbered boxes: processes   ·   D1–D6: logical data stores',19,fill=MUTED)
s.text(40,2170,'Repeated identifiers refer to the same entity/store. Crossing lines are not connections unless an endpoint is shown.',18,fill=MUTED)
add('02-dfd-level-1','System data flows','DFD · Level 1','Five connected processes show the movement of requests, records, files and service data.',s,[
 'Gane–Sarson notation: external entities are rectangles, processes have a numbered header and a transformation name, and data stores have an identifier compartment. Every arrow is a named data flow.',
 'D1 = Supabase Auth and profiles; D2 = listings and universities; D3 = saved_listings; D4 = viewing_requests; D5 = verification_requests and listing_reviews; D6 = Storage. Repeated identifiers refer to the same logical entity or store.',
 'The system boundary includes the app and Supabase. Google Maps and optional Cloud Translation are external services. Cost estimates are calculated locally, not persisted as a separate data store.',
 'Review and moderate combines identity review, property review, account moderation and viewing reports. Listing identity verification and property approval remain separate results.',
 'Authentication, row-level policies and server checks protect writes. Private documents use authorized access; public listing images do not. Storage cleanup is handled through its API.'
],['supabase/migrations/','src/views/SearchPage.jsx','src/views/RequestViewingPage.jsx','src/views/LandlordAppointmentsPage.jsx','src/components/ListingForm.jsx','src/app/api/admin/users/route.js','src/app/api/translate/route.js'],True)

# 3. Domain class diagram — no fictional JavaScript inheritance.
s=SVG(1800,1400,'HousingFinder — domain class relationships','A UML-style domain class model of the implemented relational entities, including multiplicities and one conceptual composition relationship.')
s.text(40,35,'Domain classes · selected persistent attributes',26,600)
def cls(x,y,w,name,attributes):
    h=66+len(attributes)*29
    s.rect(x,y,w,h,r=0);s.rect(x,y,w,51,SOFT,LINE,r=0)
    s.text(x+w/2,y+33,name,22,600,anchor='middle')
    s.text(x+18,y+80,attributes,18,lineheight=29)
    return h
cls(60,80,330,'AuthUser (Supabase)',['id: UUID {PK}','email: text','credentials / session metadata'])
cls(60,390,330,'Profile',['id: UUID {PK, FK AuthUser}','full_name: text','role: student | landlord | admin','account_status: active | suspended','created_at: timestamp'])
cls(700,80,470,'Listing',['id: UUID {PK}','landlord_id: UUID {FK Profile}','university_id: UUID? {FK}','title, description, address: text','monthly_rent, security_deposit: numeric','latitude, longitude: number','status: draft | published','lease_duration_months: integer?','image_paths: text[0..10]','utility billing/rates; van service','title/description locale copies: text?'])
cls(1310,80,420,'University',['id: UUID {PK}','slug, name, city: text','latitude, longitude: number'])
cls(720,660,410,'ListingReview',['listing_id: UUID {PK, FK Listing}','status: approved | rejected','reviewed_at: timestamp'])
cls(60,900,400,'VerificationRequest',['id: UUID {PK}','landlord_id: UUID {FK Profile}','full_name, phone: text','document_path: text','status: pending | approved | rejected','reviewed_at: timestamp?'])
cls(650,950,390,'SavedListing',['student_id: UUID {PK, FK Profile}','listing_id: UUID {PK, FK Listing}','created_at: timestamp'])
cls(1280,900,450,'ViewingRequest',['id: UUID {PK}','student_id: UUID {FK Profile}','listing_id: UUID {FK Listing}','preferred_at: timestamp','message: text','status: pending | accepted | declined'])
# Associations route in the whitespace between classes.
s.path([(225,233),(225,390)]);s.label(244,257,'1',18,'start');s.label(244,374,'1',18,'start');s.label(325,317,'provisions',17)
s.path([(390,430),(520,430),(520,250),(700,250)]);s.label(413,417,'1',18);s.label(672,235,'0..*',18);s.label(600,237,'owns',17)
s.path([(1170,170),(1310,170)]);s.label(1190,156,'0..*',17);s.label(1290,156,'0..1',17);s.label(1240,205,'campus',16)
# Filled diamond: one ListingReview has exactly one listing lifecycle owner.
s.parts.append(f'<path d="M925 465 934 479 925 493 916 479Z" fill="{INK}" stroke="{INK}"/>')
s.path([(925,493),(925,660)]);s.label(948,520,'1',18);s.label(952,640,'0..1',18);s.label(1010,581,'review',17)
s.path([(225,601),(225,900)]);s.label(244,631,'1',18,'start');s.label(249,881,'0..*',18,'start');s.label(305,770,'submits',17)
s.path([(390,540),(550,540),(550,1040),(650,1040)]);s.label(415,526,'1',18);s.label(623,1027,'0..*',18);s.label(550,800,'saves',17)
s.path([(1170,440),(1210,440),(1210,878),(845,878),(845,950)]);s.label(1192,426,'1',18);s.label(875,932,'0..*',18);s.label(1065,863,'saved as',17)
s.path([(1170,350),(1510,350),(1510,900)]);s.label(1195,335,'1',18);s.label(1542,882,'0..*',18);s.label(1510,575,'receives',17)
s.path([(390,590),(490,590),(490,1245),(1510,1245),(1510,1140)]);s.label(413,577,'1',18);s.label(1544,1170,'0..*',18);s.label(900,1230,'requests (student role)',17)
s.text(40,1320,'Association: solid line    •    Composition: filled diamond at Listing    •    ? = nullable    •    * = many',19,fill=MUTED)
s.text(40,1360,'Roles are Profile values, not subclasses. Stored file paths are references; they do not imply automatic Storage-file deletion.',18,fill=MUTED)
add('03-domain-classes','Class and entity relationships','UML · Class diagram','Persistent domain objects, foreign-key associations, multiplicities, and review ownership.',s,[
 'This is a domain model mapped to database tables. The application uses React components and functions; these boxes are not claims that JavaScript classes exist.',
 'A profile belongs to one Auth user. A listing has one landlord profile and optionally one university. Each saved-home row has a composite primary key: student_id + listing_id.',
 'The filled diamond models Listing → ListingReview as composition: a review cannot exist without its listing and is deleted with it. Other lines are associations. Database cascades also apply to other dependent rows.',
 'Student, landlord, and admin are role values, so no entity inheritance is shown. Shared aggregation of Storage files is not asserted: paths are references and file cleanup uses Storage APIs.',
 'The full schema has additional attributes, including separate utility billing/rate columns and six localized text columns. A reviewer’s profile ID is not stored in ListingReview or VerificationRequest; no reviewer foreign key is invented.',
 'The student_id name in SavedListing is a schema name. Its current insert policy checks ownership and publication, but does not explicitly require the student role. Viewing-request inserts do require that role.'
],['supabase/migrations/20260920000000_core.sql','supabase/migrations/20260920000001_admin.sql','supabase/migrations/20260921000000_universities.sql','supabase/migrations/20260922000001_listing_photos.sql','supabase/migrations/20260922000003_listing_verification.sql','supabase/migrations/20260922000004_account_moderation.sql'])

# 4. Object snapshot with fictional data.
s=SVG(1640,1100,'HousingFinder — example object snapshot','Fictional instances show a landlord listing, one student save, a pending viewing, an approved identity request and a separate approved listing review.')
s.text(35,40,'Example objects · one moment in time',27,600)
def obj(x,y,w,name,attrs):
    h=64+len(attrs)*27
    s.rect(x,y,w,h,r=0);s.rect(x,y,w,48,SOFT,LINE,r=0)
    s.text(x+w/2,y+31,name,20,600,anchor='middle',underline=True)
    s.text(x+18,y+77,attrs,18,lineheight=27)
obj(40,100,355,'studentA : Profile',['id = "ST-01"','full_name = "Maya"','role = student','account_status = active'])
obj(40,520,355,'ownerA : Profile',['id = "LL-01"','full_name = "Campus Homes"','role = landlord','account_status = active'])
obj(650,120,410,'savedA : SavedListing',['student_id = "ST-01"','listing_id = "L-01"'])
obj(650,470,410,'studioA : Listing',['id = "L-01"','landlord_id = "LL-01"','university_id = "U-01"','title = "Campus Studio"','monthly_rent = 6500','status = published'])
obj(1210,100,385,'visitA : ViewingRequest',['id = "VR-01"','student_id = "ST-01"','listing_id = "L-01"','preferred_at = future date/time','status = pending'])
obj(1210,520,385,'campusA : University',['id = "U-01"','slug = "chula"','name = "Chulalongkorn University"'])
obj(40,850,420,'identityA : VerificationRequest',['landlord_id = "LL-01"','status = approved'])
obj(650,850,410,'reviewA : ListingReview',['listing_id = "L-01"','status = approved'])
s.path([(395,180),(650,180)]);s.label(520,166,'saves')
s.path([(395,230),(510,230),(510,65),(1410,65),(1410,100)]);s.label(830,55,'requests a viewing')
s.path([(855,238),(855,470)]);s.label(926,361,'references')
s.path([(395,590),(650,590)]);s.label(520,577,'owns')
s.path([(1410,299),(1410,385),(1040,385),(1040,470)]);s.label(1230,372,'for this home')
s.path([(1060,570),(1210,570)]);s.label(1135,554,'near campus',16)
s.path([(217,692),(217,850)]);s.label(295,788,'submitted')
s.parts.append(f'<path d="M855 696 864 710 855 724 846 710Z" fill="{INK}"/>');s.path([(855,724),(855,850)]);s.label(932,790,'has review')
s.text(35,1042,'All names, short identifiers and values in this snapshot are illustrative. Production identifiers are UUIDs.',18,fill=MUTED)
s.text(35,1074,'Identity approval and property review are separate facts. Publication does not require either approval.',18,fill=MUTED)
add('04-object-snapshot','Object relationships in context','UML · Object diagram','Fictional instances make the class relationships concrete.',s,[
 'Underlined headers use UML object notation: objectName : ClassName. Links connect specific instances, so class-level multiplicities are omitted.',
 'One student has saved one published listing and requested a future viewing. The landlord has an approved identity submission; the listing has its own separate review.',
 'A listing may be published even when its identity or listing review is pending, missing, or rejected. The approved values shown here are example data, not publication prerequisites.'
],['supabase/migrations/','src/components/ListingTrust.jsx','src/views/RoomDetailsPage.jsx'])

# 5. Use cases: one system boundary, four actor capability views.
s=SVG(1520,1530,'HousingFinder — use case diagram','Four actor views connect to common discovery/account capabilities and role-specific student, landlord and admin use cases inside a single system boundary.')
s.rect(330,70,1140,1390,r=0);s.text(355,107,'HousingFinder',25,600)
lanes=[
 (235,'All users',['Browse and filter homes','View a map and estimate monthly cost','Register, sign in or recover a password']),
 (585,'Student',['Save or unsave a home','Request a future viewing','Track viewing request status']),
 (935,'Landlord',['Create, edit or publish a listing','Accept or decline a viewing request','Submit identity details and a document']),
 (1285,'Admin',['Approve/reject landlord identity','Review/moderate listings','Moderate accounts and inspect viewings'])]
for cy,actor,cases in lanes:
    s.actor(135,cy-65,actor)
    for j,case in enumerate(cases):
        yy=cy-85+j*86
        s.path([(162,cy-32),(280,cy-32),(360,yy),(560,yy)])
        s.ellipse(960,yy,400,33,case)
    if actor!='Admin': s.path([(355,cy+200),(1445,cy+200)],color='#e7e9eb',width=1)
s.text(30,1503,'All three signed-in roles also use the common “All users” capabilities. Protected use cases require appropriate access.',18,fill=MUTED)
add('05-use-cases','Actors and system capabilities','UML · Use case diagram','Common discovery/account functions plus the three role-specific workflows.',s,[
 'The large rectangle is the system boundary. Actors sit outside it; ellipses are user goals. Solid lines are actor–use-case associations, not data-flow arrows.',
 '“All users” includes visitors and signed-in users. The role lanes add workflows; they do not suggest that landlords or admins lose common browsing functions.',
 'Authentication and authorization are preconditions for protected goals. No artificial «include» or «extend» relationships are added merely to connect features.',
 'The account model does not let a registrant choose admin. Admin promotion is performed manually by a project owner. Payments, bookings and rental contracts are outside the implemented scope.'
],['README.md','src/components/Navbar.jsx','src/views/RegisterPage.jsx','src/views/RequestViewingPage.jsx','src/views/VerificationDetailPage.jsx','src/app/api/admin/users/route.js'],True)

# 6. Sequence diagram, main successful request/decision path.
s=SVG(1860,1570,'HousingFinder — viewing sequence','A student requests a viewing through the React UI, Supabase verifies the user and policies validate the insert, then the landlord responds through a secure database function.')
xs=[100,430,760,1090,1420,1750]
names=['Student','Student UI','Supabase Auth','PostgreSQL / RLS','Landlord UI','Landlord']
for x,name in zip(xs,names):
    s.rect(x-91,35,182,65,SOFT,r=0);s.text(x,75,name,19,600,anchor='middle')
    s.path([(x,100),(x,1440)],dash=True,color=LINE)
def msg(a,b,y,label,reply=False):
    x1,x2=xs[a],xs[b]
    s.path([(x1,y),(x2,y)],True,reply)
    lines=textwrap.wrap(label,max(25,int((abs(x2-x1)-30)/8)))
    for i,line in enumerate(lines): s.label((x1+x2)/2,y-13-(len(lines)-i-1)*21,line,17)
def selfmsg(a,y,label):
    x=xs[a];s.path([(x,y),(x+75,y),(x+75,y+33),(x,y+33)],True);s.label(x+95,y+10,label,17,'start')
def band(y,label):
    s.rect(30,y,1800,37,SOFT,stroke='none',r=0);s.text(45,y+25,label,18,600)
band(122,'1 · Student creates a request')
msg(0,1,205,'Home, future slot and message')
msg(1,2,275,'auth.getUser()')
msg(2,1,335,'Authenticated user',True)
s.rect(238,365,782,70,'#fff8fa',stroke='#e0c5cc',r=0)
s.text(256,393,'Alternative: no user → redirect to /login; stop this request attempt.',17,500)
s.text(256,418,'Invalid/missing date or time → show a form error; do not insert.',17,fill=MUTED)
selfmsg(1,467,'Validate a future date/time')
msg(1,3,555,'INSERT viewing_requests {listing_id, student_id, preferred_at, message}')
s.rect(955,579,600,86,SOFT,r=0)
s.text(974,607,['RLS/constraints: active account, student role, matching user,','published listing, future time, status = pending.'],17,lineheight=25)
msg(3,1,705,'Insert result; record starts pending',True)
msg(1,0,765,'Navigate to /appointments; show request status',True)
band(810,'2 · Landlord reviews and responds')
msg(5,4,890,'Open own viewing requests')
msg(4,3,955,'SELECT requests for landlord-owned listings')
msg(3,4,1015,'Owned viewing request records',True)
msg(5,4,1085,'Choose accepted or declined')
msg(4,3,1155,'RPC set_viewing_status(request_id, next_status)')
s.rect(940,1175,640,76,SOFT,r=0)
s.text(958,1203,['Function checks active account, valid next status,','listing ownership and current status = pending.'],17,lineheight=25)
msg(3,4,1290,'Success; landlord UI refreshes requests/badge',True)
msg(1,3,1360,'Student loads/refetches own viewing requests')
msg(3,1,1420,'Updated status: accepted or declined',True)
s.text(35,1500,'Errors return to the UI for display; no success navigation is shown on a failed insert or status update.',18,fill=MUTED)
s.text(35,1538,'There is no email/SMS step. Landlord badges poll every 15 seconds while visible and refresh on focus or local changes.',18,fill=MUTED)
add('06-viewing-sequence','Viewing request and decision','UML · Sequence diagram','The implemented request, ownership checks, landlord response, and status retrieval.',s,[
 'This diagram shows the authorized main path. The UI validates date/time before writing. PostgreSQL policies and constraints enforce additional access and data requirements.',
 'The status update uses public.set_viewing_status rather than granting unrestricted updates to viewing_requests. Only an active listing owner can change a pending request to accepted or declined.',
 'The student sees a changed status when the page loads/refetches. No real-time subscription, email, SMS, payment or booking confirmation is implied.',
 'The Supabase client API is a transport layer between the UI and database. It is omitted as a separate lifeline to keep this interaction focused.'
],['src/views/RequestViewingPage.jsx','src/views/AppointmentsPage.jsx','src/views/LandlordAppointmentsPage.jsx','src/lib/usePendingViewings.js','supabase/migrations/20260920000000_core.sql','supabase/migrations/20260922000004_account_moderation.sql'])

# 7. Activity diagram with role swimlanes and guarded decisions.
s=SVG(1500,1660,'HousingFinder — viewing activity','A three-lane activity diagram follows student authentication, valid viewing request creation, landlord decision, and status display, including error branches.')
for i,label in enumerate(['Student','HousingFinder + backend','Landlord']):
    x=i*500;s.rect(x+15,25,470,1560,stroke=LINE,r=0);s.rect(x+15,25,470,65,SOFT,LINE,r=0);s.text(x+250,65,label,23,600,anchor='middle')
def action(x,y,label,w=330,h=72):
    s.rect(x-w/2,y-h/2,w,h,r=15)
    ls=label.split('\n');s.text(x,y-(len(ls)-1)*12+7,ls,19,500,anchor='middle',lineheight=25)
s.circle(250,130,10)
action(250,215,'Browse and choose a home')
s.path([(250,140),(250,179)],True)
s.diamond(750,215,190,100,'Signed in?');s.path([(415,215),(655,215)],True)
action(250,350,'Sign in / create account')
s.path([(750,265),(750,350),(415,350)],True);s.label(730,313,'[no]',17)
action(250,485,'Choose future date/time\nand optional message',h=84)
s.diamond(250,420,24,24,'')
s.path([(250,386),(250,408)],True);s.path([(250,432),(250,443)],True)
s.path([(750,165),(750,125),(950,125),(950,405),(275,405),(275,420),(262,420)],True);s.label(855,111,'[yes]',17)
action(750,485,'Validate input and\nsubmit viewing request',h=84);s.path([(415,485),(585,485)],True)
s.diamond(750,650,210,110,'Input and access\nchecks pass?');s.path([(750,527),(750,595)],True)
action(250,650,'Show validation / access error',w=370)
s.path([(645,650),(435,650)],True);s.label(535,635,'[no]',17)
s.path([(65,650),(40,650),(40,485),(85,485)],True);s.label(45,570,'revise / retry',16,'start')
action(750,810,'Store request\nstatus = pending',h=84);s.path([(750,705),(750,768)],True);s.label(788,746,'[yes]',17)
action(1250,810,'Review own listing request');s.path([(915,810),(1085,810)],True)
s.diamond(1250,955,210,110,'Landlord\ndecision');s.path([(1250,846),(1250,900)],True)
action(1122,1100,'Accept',w=180);action(1378,1100,'Decline',w=180)
s.path([(1145,955),(1122,955),(1122,1064)],True);s.label(1135,1024,'[accept]',17)
s.path([(1355,955),(1378,955),(1378,1064)],True);s.label(1380,1024,'[decline]',17)
# Merge point is a UML merge diamond, not a fork/join synchronization bar.
s.diamond(1250,1200,36,36,'')
s.path([(1122,1136),(1122,1200),(1232,1200)],True)
s.path([(1378,1136),(1378,1200),(1268,1200)],True)
action(750,1280,'Check owner / active / pending;\napply accepted or declined',h=84)
s.path([(1250,1218),(1250,1280),(915,1280)],True)
action(750,1430,'Return result; refresh\nlandlord requests',h=84);s.path([(750,1322),(750,1388)],True)
action(250,1430,'Load own requests\nand read updated status',h=84);s.path([(585,1430),(415,1430)],True)
s.circle(250,1535,14,'white',INK);s.circle(250,1535,8);s.path([(250,1472),(250,1521)],True)
s.text(30,1630,'No landlord response leaves the stored status pending. A rejected status update shows an error and preserves the record.',18,fill=MUTED)
add('07-viewing-activity','Viewing workflow and branches','UML · Activity diagram','Swimlanes separate student actions, system responsibilities, and the landlord’s decision.',s,[
 'A request enters pending only after input checks and database policies accept it. A failed request displays an error; the student may revise details or resolve access before retrying.',
 'The two landlord branches merge; they are alternatives, not parallel actions. Until the landlord responds, the request stays pending. There is no implemented cancellation, payment, expiry or booking state.',
 'The status-update function can fail if the account is inactive, the request is no longer pending, the caller is not the owner, or the next status is invalid. That error leaves the status unchanged.',
 '“Load own requests” means a page load/refetch, not an unsolicited push notification.'
],['src/views/RequestViewingPage.jsx','src/views/LandlordAppointmentsPage.jsx','src/views/AppointmentsPage.jsx','supabase/migrations/20260922000004_account_moderation.sql'],True)

# Keep SVG metadata IDs unique when all seven drawings share one HTML document.
sections=[]
for i,d in enumerate(DIAGRAMS,1):
    svg=d['svg'].replace('id="title"',f'id="{d["slug"]}-title"').replace('id="desc"',f'id="{d["slug"]}-desc"').replace('aria-labelledby="title desc"',f'aria-labelledby="{d["slug"]}-title {d["slug"]}-desc"')
    for marker in ('arrow','triangle'):
        svg=svg.replace(f'id="{marker}"',f'id="{d["slug"]}-{marker}"').replace(f'url(#{marker})',f'url(#{d["slug"]}-{marker})')
    notes=''.join(f'<li>{escape(n)}</li>' for n in d['notes'])
    sources=''.join(f'<li><code>{escape(p)}</code></li>' for p in d['sources'])
    sections.append(f'''<section class="diagram-page {'portrait' if d['portrait'] else ''}" id="{d['slug']}" aria-labelledby="heading-{i}" data-index="{i-1}" {'hidden' if i>1 else ''}>
<header class="page-heading"><p class="eyebrow">{i:02d} / 07 · {escape(d['kind'])}</p><h2 id="heading-{i}" tabindex="-1">{escape(d['title'])}</h2><p>{escape(d['summary'])}</p></header>
<div class="diagram-frame" tabindex="0" role="region" aria-label="{escape(d['title'])}, scroll to explore when zoomed"><div class="diagram-canvas">{svg}</div></div>
<div class="diagram-notes"><h3>How to explain it</h3><ul>{notes}</ul><details><summary>Implementation references</summary><ul>{sources}</ul></details></div>
</section>''')
nav=''.join(f'<a href="#{d["slug"]}" data-index="{i}" {"aria-current=\"page\"" if i==0 else ""}><span>{i+1:02d}</span>{escape(d["title"])}</a>' for i,d in enumerate(DIAGRAMS))
mobile_options=''.join(f'<option value="{i}">{i+1:02d} · {escape(d["title"])}</option>' for i,d in enumerate(DIAGRAMS))
html='''<!doctype html>
<html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1"><title>HousingFinder · System diagrams</title>
<style>
:root{color-scheme:light;--ink:#20242a;--muted:#626b75;--line:#dedfe2;--accent:#a72f49}*{box-sizing:border-box}body{margin:0;background:#fff;color:var(--ink);font:15px/1.6 ui-sans-serif,system-ui,-apple-system,BlinkMacSystemFont,"Segoe UI",sans-serif}button,a{touch-action:manipulation}button{font:inherit;cursor:pointer}button:disabled{cursor:not-allowed;opacity:.4}a{color:inherit}button:focus-visible,a:focus-visible,summary:focus-visible,[tabindex]:focus-visible{outline:2px solid var(--accent);outline-offset:4px}button{min-height:34px;font-size:12px;border:1px solid var(--line);border-radius:6px;background:#fff;color:var(--ink);padding:5px 10px}button:hover{background:#f5f6f7}.primary{background:var(--ink);border-color:var(--ink);color:#fff}.primary:hover{background:#343941}button[aria-pressed=true]{border-color:var(--ink);background:#f5f6f7}.skip{position:absolute;left:20px;top:-80px;background:#fff;padding:12px;z-index:10}.skip:focus{top:12px}.shell{display:grid;grid-template-columns:264px minmax(0,1fr);min-height:100vh}.sidebar{position:sticky;top:0;height:100vh;padding:32px 22px;display:flex;flex-direction:column;border-right:1px solid var(--line);overflow-y:auto}.brand{font-size:20px;font-weight:750;letter-spacing:-.04em;text-decoration:none}.subtitle{font-size:13px;color:var(--muted);margin:4px 0 30px}.sidebar nav{display:grid;gap:5px}.sidebar nav a{display:flex;align-items:center;gap:12px;min-height:48px;padding:8px 9px;border-radius:5px;text-decoration:none;font-size:14px;line-height:1.35}.sidebar nav a span{font-size:12px;color:var(--muted);font-variant-numeric:tabular-nums}.sidebar nav a:hover{background:#f5f6f7}.sidebar nav a[aria-current=page]{font-weight:650;background:#f5f6f7;box-shadow:inset 2px 0 var(--accent)}.sidebar-foot{margin-top:auto;padding-top:36px;font-size:12px;color:var(--muted)}main{min-width:0;padding:22px clamp(20px,2.8vw,44px) 32px}.topline{display:flex;flex-wrap:wrap;align-items:center;justify-content:space-between;gap:12px;margin-bottom:14px}.topline h1{font-size:14px;font-weight:500;color:var(--muted);margin:0}.topline .exports{display:flex;flex-wrap:wrap;gap:8px}.eyebrow{text-transform:uppercase;letter-spacing:.1em;font-size:10px;font-weight:600;color:var(--accent);margin:0 0 6px}.page-heading h2{font-size:clamp(19px,1.6vw,23px);font-weight:650;letter-spacing:-.045em;line-height:1.2;margin:0}.page-heading>p:last-child{max-width:760px;color:var(--muted);margin:12px 0 0;font-size:15px}.toolbar{display:flex;align-items:center;justify-content:space-between;flex-wrap:wrap;gap:8px;margin:12px 0 10px}.zoom,.page-switch{display:flex;align-items:center;gap:8px}.zoom button{min-width:34px}.zoom output{font-size:12px;min-width:42px;text-align:center;font-variant-numeric:tabular-nums}.page-switch span{font-size:12px;color:var(--muted);margin:0 5px}.diagram-frame{width:100%;height:auto;overflow:auto;background:#fff}.diagram-canvas{display:flex;justify-content:center;align-items:flex-start;min-height:100%;padding:20px}.diagram-canvas svg{display:block;height:auto;flex-shrink:0;max-width:none}.diagram-notes{max-width:900px;margin-top:28px}.diagram-notes h3{font-size:15px;font-weight:650;margin:0 0 10px}.diagram-notes ul{margin:0;padding-left:20px;color:var(--muted);font-size:14px}.diagram-notes li+li{margin-top:8px}details{margin-top:22px;font-size:13px}summary{cursor:pointer;min-height:44px;align-content:center;color:var(--ink)}code{font-family:ui-monospace,SFMono-Regular,Menlo,monospace;font-size:12px;overflow-wrap:anywhere}.status{font-size:12px;color:var(--muted);min-height:20px;margin:8px 0 0}.viewer:is(:fullscreen,.is-expanded){width:100%;height:100dvh;padding:16px;background:#fff;overflow:hidden}.viewer:is(:fullscreen,.is-expanded) #pages,.viewer:is(:fullscreen,.is-expanded) .diagram-page:not([hidden]){height:100%;min-height:0}.viewer:is(:fullscreen,.is-expanded) .diagram-page:not([hidden]){display:flex;flex-direction:column}.viewer:is(:fullscreen,.is-expanded) .page-heading,.viewer:is(:fullscreen,.is-expanded) .toolbar{flex-shrink:0}.viewer:is(:fullscreen,.is-expanded) .diagram-frame{flex:1;min-height:0;height:auto;overscroll-behavior:contain;scrollbar-gutter:stable}.viewer:is(:fullscreen,.is-expanded) .diagram-canvas{align-items:center}.viewer:is(:fullscreen,.is-expanded) .diagram-notes{display:none}.mobile-label{display:none}[hidden]{display:none!important}
.viewer.is-expanded{position:fixed;inset:0;z-index:100}.mobile-picker,.mobile-navigation{display:none}
@media(max-width:900px){body{padding-bottom:calc(78px + env(safe-area-inset-bottom))}.mobile-picker{display:block;margin-top:14px}.mobile-picker label{display:block;margin-bottom:5px;font-size:12px;font-weight:600;color:var(--muted)}.mobile-picker select{width:100%;min-height:48px;padding:10px 36px 10px 12px;border:1px solid var(--line);border-radius:6px;background:white;color:var(--ink);font:inherit;font-size:16px}.mobile-picker select:focus-visible{outline:2px solid var(--accent);outline-offset:3px}.mobile-navigation{position:fixed;inset:auto 0 0;z-index:20;display:grid;grid-template-columns:1fr auto 1fr;align-items:center;gap:12px;padding:10px 20px calc(10px + env(safe-area-inset-bottom));border-top:1px solid var(--line);background:white}.mobile-navigation button{display:flex;align-items:center;justify-content:center;gap:8px;min-height:44px;font-size:14px;font-weight:500}.mobile-navigation output{min-width:44px;text-align:center;font-size:13px;color:var(--muted);font-variant-numeric:tabular-nums}.page-switch{display:none}.viewer:is(:fullscreen,.is-expanded) .page-switch{display:flex}.shell{grid-template-columns:1fr}.sidebar{position:static;height:auto;border:0;padding:24px 20px 0;display:block}.subtitle{display:none}.sidebar nav{display:none}.sidebar nav a{min-height:44px;flex:0 0 auto;max-width:230px;border:1px solid var(--line);font-size:12px;padding:8px 12px}.sidebar nav a[aria-current=page]{box-shadow:none;border-color:var(--ink)}.sidebar-foot{display:none}main{padding:22px 20px 40px}.topline{margin-bottom:14px}.topline h1{display:none}.diagram-canvas{padding:10px}.page-switch span{display:none}button{min-height:44px}.exports button{font-size:12px}.mobile-label{display:inline}.viewer:is(:fullscreen,.is-expanded){padding:12px}}
@media print{@page{size:A3 landscape;margin:15mm}@page portrait{size:A3 portrait;margin:14mm}body{font-size:10pt}.shell{display:block}.sidebar,.topline,.toolbar,.status,.skip,.mobile-navigation{display:none!important}main{padding:0}.diagram-page,.diagram-page[hidden]{display:block!important;break-after:page;page-break-after:always}.diagram-page.portrait{page:portrait}.page-heading h2{font-size:23pt}.page-heading p{font-size:10pt;margin:5mm 0}.eyebrow{font-size:8pt}.diagram-frame{height:auto!important;border:0;overflow:visible}.diagram-canvas{padding:0;display:block;min-height:0}.diagram-canvas svg{width:100%!important;height:auto!important;max-height:205mm;object-fit:contain}.portrait .diagram-canvas svg{max-height:290mm}.diagram-notes{margin-top:7mm;max-width:none}.diagram-notes h3{font-size:11pt}.diagram-notes ul{font-size:8pt;line-height:1.4;columns:2;column-gap:9mm}.diagram-notes li{break-inside:avoid}.diagram-notes li+li{margin-top:2mm}details{display:none}.diagram-page:last-child{break-after:auto}body.print-current .diagram-page[hidden]{display:none!important}body.print-current .diagram-page{break-after:auto}.viewer:is(:fullscreen,.is-expanded){padding:0;overflow:visible}}
@media(prefers-reduced-motion:reduce){*{scroll-behavior:auto!important}}
</style></head><body><a class="skip" href="#main">Skip to diagram</a><div class="shell"><aside class="sidebar"><a class="brand" href="#01-structure-chart">HousingFinder.</a><p class="subtitle">System models · presentation pack</p><nav aria-label="Diagrams">NAV</nav><div class="mobile-picker"><label for="diagram-select">Diagram</label><select id="diagram-select">MOBILE_OPTIONS</select></div><p class="sidebar-foot">Seven diagrams based on the current implementation.<br>Offline · editable SVG · print ready</p></aside><main id="main"><div class="topline"><h1>Software engineering / system documentation</h1><div class="exports"><button id="svg-download">Save SVG</button><button id="png-download">Save PNG</button><button id="print-current">Print diagram</button><button id="print-all" class="primary">Print all / PDF</button></div></div><div class="viewer"><div id="pages">SECTIONS</div></div><p class="status" role="status" id="status" aria-live="polite"></p></main></div><nav class="mobile-navigation" aria-label="Diagram navigation"><button id="mobile-previous" aria-label="Previous diagram">← Previous</button><output id="mobile-page-number" aria-live="polite">1 / 7</output><button id="mobile-next" aria-label="Next diagram">Next →</button></nav>
<script>
'use strict';
const pages=[...document.querySelectorAll('.diagram-page')];
const links=[...document.querySelectorAll('.sidebar nav a')];
let current=0, zoom=null;
const toolbar=document.createElement('div');toolbar.className='toolbar';toolbar.innerHTML='<div class="zoom" aria-label="Diagram zoom"><button id="zoom-out" aria-label="Zoom out">−</button><output id="zoom-output" aria-live="polite">Fit</output><button id="zoom-in" aria-label="Zoom in">+</button><button id="zoom-fit">Fit width</button><button id="fullscreen">Full screen</button></div><div class="page-switch"><button id="previous" aria-label="Previous diagram">←</button><span id="page-number"></span><button id="next" aria-label="Next diagram">→</button></div>';
const status=document.getElementById('status');
pages[0].querySelector('.page-heading').after(toolbar);
function announce(message){status.textContent=message;}
function fit(){
 const page=pages[current],frame=page.querySelector('.diagram-frame'),svg=page.querySelector('svg');
 const [,,w,h]=svg.getAttribute('viewBox').split(' ').map(Number);
 const pad=innerWidth<=900?20:40;
 const fullscreen=isExpanded();
 const factor=zoom??Math.min(1,(frame.clientWidth-pad)/w,...(fullscreen?[(frame.clientHeight-pad)/h]:[]));
 svg.style.width=Math.round(w*factor)+'px';
 page.querySelector('.diagram-canvas').style.minWidth=zoom?Math.max(frame.clientWidth,w*factor+pad)+'px':'';
 document.getElementById('zoom-output').value=zoom?Math.round(factor*100)+'%':fullscreen?'Fit':'Width';
 document.getElementById('zoom-out').disabled=zoom!==null&&zoom<=.2;
 document.getElementById('zoom-in').disabled=zoom!==null&&zoom>=3;
}
function select(index,focus=false){
 current=Math.max(0,Math.min(pages.length-1,index));zoom=null;
 pages.forEach((page,i)=>{page.hidden=i!==current;links[i].toggleAttribute('aria-current',i===current);if(i===current)links[i].setAttribute('aria-current','page')});
 pages[current].querySelector('.page-heading').after(toolbar);
 document.getElementById('page-number').textContent=String(current+1).padStart(2,'0')+' / 07';
 document.getElementById('previous').disabled=current===0;document.getElementById('next').disabled=current===pages.length-1;
 document.getElementById('mobile-previous').disabled=current===0;document.getElementById('mobile-next').disabled=current===pages.length-1;
 document.getElementById('mobile-page-number').value=(current+1)+' / '+pages.length;document.getElementById('diagram-select').value=String(current);
 fit();announce('');if(focus)pages[current].querySelector('h2').focus({preventScroll:true});
}
function fromHash(){const index=pages.findIndex(page=>page.id===location.hash.slice(1));select(index<0?0:index);}
function change(index){history.pushState(null,'','#'+pages[index].id);select(index,true);if(innerWidth<=900)window.scrollTo({top:0,behavior:'instant'});}
function zoomBy(delta){
 const svg=pages[current].querySelector('svg');const w=svg.viewBox.baseVal.width;
 zoom=Math.min(3,Math.max(.2,(zoom??svg.getBoundingClientRect().width/w)+delta));fit();
}
document.getElementById('zoom-in').addEventListener('click',()=>zoomBy(.15));document.getElementById('zoom-out').addEventListener('click',()=>zoomBy(-.15));document.getElementById('zoom-fit').addEventListener('click',()=>{zoom=null;fit();pages[current].querySelector('.diagram-frame').scrollTo(0,0)});
document.getElementById('previous').addEventListener('click',()=>change(current-1));document.getElementById('next').addEventListener('click',()=>change(current+1));
document.getElementById('mobile-previous').addEventListener('click',()=>change(current-1));
document.getElementById('mobile-next').addEventListener('click',()=>change(current+1));
document.getElementById('diagram-select').addEventListener('change',event=>change(Number(event.target.value)));
links.forEach((link,index)=>link.addEventListener('click',event=>{event.preventDefault();change(index)}));
window.addEventListener('hashchange',fromHash);window.addEventListener('resize',fit);
const viewer=document.querySelector('.viewer');
function isExpanded(){return Boolean(document.fullscreenElement)||viewer.classList.contains('is-expanded')}
function syncExpanded(){
 zoom=null;const expanded=isExpanded();
 document.getElementById('zoom-fit').textContent=expanded?'Fit diagram':'Fit width';
 document.getElementById('fullscreen').textContent=expanded?'Exit full screen':'Full screen';
 document.body.style.overflow=viewer.classList.contains('is-expanded')?'hidden':'';
 requestAnimationFrame(()=>{fit();pages[current].querySelector('.diagram-frame').scrollTo(0,0)});
}
document.getElementById('fullscreen').addEventListener('click',async()=>{
 if(document.fullscreenElement){await document.exitFullscreen();return}
 if(viewer.classList.contains('is-expanded')){viewer.classList.remove('is-expanded');syncExpanded();return}
 try{await viewer.requestFullscreen()}catch{viewer.classList.add('is-expanded');syncExpanded()}
});
document.addEventListener('fullscreenchange',syncExpanded);
document.addEventListener('keydown',event=>{if(event.key==='Escape'&&viewer.classList.contains('is-expanded')){viewer.classList.remove('is-expanded');syncExpanded()}});
function exportSvg(){const svg=pages[current].querySelector('svg').cloneNode(true);svg.removeAttribute('style');return new XMLSerializer().serializeToString(svg)}
function download(blob,filename){const url=URL.createObjectURL(blob),a=document.createElement('a');a.href=url;a.download=filename;document.body.append(a);a.click();a.remove();setTimeout(()=>URL.revokeObjectURL(url),1000)}
document.getElementById('svg-download').addEventListener('click',()=>{download(new Blob([exportSvg()],{type:'image/svg+xml;charset=utf-8'}),pages[current].id+'.svg');announce('SVG downloaded. It stays sharp at any size.');});
document.getElementById('png-download').addEventListener('click',async()=>{
 const button=document.getElementById('png-download');button.disabled=true;announce('Preparing a high-resolution PNG…');
 try{const data=exportSvg(),url=URL.createObjectURL(new Blob([data],{type:'image/svg+xml;charset=utf-8'}));
 try{const image=new Image();image.src=url;await image.decode();const canvas=document.createElement('canvas');canvas.width=image.width*2;canvas.height=image.height*2;const ctx=canvas.getContext('2d');ctx.fillStyle='#fff';ctx.fillRect(0,0,canvas.width,canvas.height);ctx.drawImage(image,0,0,canvas.width,canvas.height);const blob=await new Promise(resolve=>canvas.toBlob(resolve,'image/png'));if(!blob)throw new Error('Unable to encode image');download(blob,pages[current].id+'.png');announce('PNG downloaded at 2× resolution.')}finally{URL.revokeObjectURL(url)}}catch{announce('PNG export failed. Use Save SVG or Print diagram instead.')}finally{button.disabled=false}
});
function printDiagrams(currentOnly){document.body.classList.toggle('print-current',currentOnly);window.print()}
document.getElementById('print-all').addEventListener('click',()=>printDiagrams(false));document.getElementById('print-current').addEventListener('click',()=>printDiagrams(true));window.addEventListener('afterprint',()=>document.body.classList.remove('print-current'));
fromHash();
</script></body></html>'''.replace('NAV',nav).replace('MOBILE_OPTIONS',mobile_options).replace('SECTIONS',''.join(sections))
(ROOT/'index.html').write_text(html)
# The public site is a compact diagram viewer; the offline pack keeps speaker notes.
compact_sections=[]
for section,d in zip(sections,DIAGRAMS):
    compact=section.split('<div class="diagram-notes">',1)[0]+'</section>'
    compact=compact.replace(f'<p>{escape(d["summary"])}</p>','')
    compact_sections.append(compact)
site_html=html.replace(''.join(sections),''.join(compact_sections))
site_html=site_html.replace('<h1>Software engineering / system documentation</h1>','')
site_html=site_html.replace('System models · presentation pack','System diagrams')
site_html=site_html.replace('<p class="sidebar-foot">Seven diagrams based on the current implementation.<br>Offline · editable SVG · print ready</p>','')
site_html=site_html.replace('.topline .exports{display:flex;', '.topline .exports{margin-left:auto;display:flex;')
(ROOT/'site.html').write_text(site_html)
print(f'Generated {len(DIAGRAMS)} SVG files and the standalone HTML viewer in {ROOT}')
