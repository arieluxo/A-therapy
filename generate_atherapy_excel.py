# A-THERAPY Professional Training Tracker
# Premium Excel workbook for personal trainer client management

import sys, os
XLSX_SKILL_DIR = '/home/z/my-project/skills/xlsx'
sys.path.insert(0, os.path.join(XLSX_SKILL_DIR, 'templates'))
sys.path.insert(0, XLSX_SKILL_DIR)
import base
base.use_palette_explicit("bottega")

from openpyxl import Workbook
from openpyxl.styles import Font, PatternFill, Border, Side, Alignment, numbers, Protection
from openpyxl.utils import get_column_letter
from openpyxl.drawing.image import Image as XlImage
from openpyxl.chart import BarChart, LineChart, Reference
from openpyxl.chart.label import DataLabelList
from openpyxl.chart.series import DataPoint, SeriesLabel
from openpyxl.worksheet.datavalidation import DataValidation
from copy import copy

# ══════════════════════════════════════════════════════════════
# COLOR TOKENS
# ══════════════════════════════════════════════════════════════
P = base.PRIMARY
PL = base.PRIMARY_LIGHT
S = base.SECONDARY
N900 = base.NEUTRAL_900
N600 = base.NEUTRAL_600
N200 = base.NEUTRAL_200
N100 = base.NEUTRAL_100
N0 = base.NEUTRAL_0
FN = base.FONT_NAME
HB = base.HEADER_BOLD
CC = base.CHART_COLORS

BRAND_DARK = "1A1A2E"
BRAND_SECTION = "F0F5F2"
BRAND_INPUT = "FAFBFC"
BRAND_KPI_BG = "F5F8F6"

OUTPUT = "/home/z/my-project/upload/A-THERAPY_Seguimiento_Profesional.xlsx"
LOGO = "/home/z/my-project/upload/atherapy_logo.png"

# ══════════════════════════════════════════════════════════════
# STYLE FACTORIES
# ══════════════════════════════════════════════════════════════
def ft(sz=10, bold=False, color=N900):
    return Font(name=FN, size=sz, bold=bold, color=color)

align_c = Alignment(horizontal='center', vertical='center', wrap_text=True)
align_l = Alignment(horizontal='left', vertical='center', wrap_text=True)
align_r = Alignment(horizontal='right', vertical='center')
align_lt = Alignment(horizontal='left', vertical='top', wrap_text=True)

fill_hdr = PatternFill('solid', fgColor=P)
fill_dk = PatternFill('solid', fgColor=BRAND_DARK)
fill_sec = PatternFill('solid', fgColor=BRAND_SECTION)
fill_inp = PatternFill('solid', fgColor=BRAND_INPUT)
fill_kpi = PatternFill('solid', fgColor=BRAND_KPI_BG)
fill_w = PatternFill('solid', fgColor=N0)
fill_a = PatternFill('solid', fgColor=N100)
fill_lg = PatternFill('solid', fgColor=PL)
fill_rest = PatternFill('solid', fgColor=N600)
fill_amb = PatternFill('solid', fgColor="FEF9E7")

def sc(ws, r, c, v, font=None, fill=None, align=None, bdr=None, nf=None):
    cell = ws.cell(row=r, column=c, value=v)
    if font: cell.font = font
    if fill: cell.fill = fill
    if align: cell.alignment = align
    if bdr: cell.border = bdr
    if nf: cell.number_format = nf
    return cell

def ms(ws, r1, c1, r2, c2, v, font=None, fill=None, align=None):
    ws.merge_cells(start_row=r1, start_column=c1, end_row=r2, end_column=c2)
    cell = ws.cell(row=r1, column=c1, value=v)
    if font: cell.font = font
    if fill: cell.fill = fill
    if align: cell.alignment = align
    for r in range(r1, r2+1):
        for c in range(c1, c2+1):
            if fill: ws.cell(row=r, column=c).fill = fill
    return cell

def afr(ws, r1, c1, r2, c2, fill):
    for r in range(r1, r2+1):
        for c in range(c1, c2+1):
            ws.cell(row=r, column=c).fill = fill

# ══════════════════════════════════════════════════════════════
# EXERCISE DATA (from original file)
# ══════════════════════════════════════════════════════════════
MESO, SEM = 7, 1

DAYS = [
    {"n":1, "type":"Upper A", "val":"BUENO", "exs": [
        {"nm":"Press Banca Multipower", "rx":"3×7-9 RPS , RiR 1", "s":[]},
        {"nm":"Jalón Alto al pecho prono", "rx":"3×8-10 RPS , RiR 1", "s":[]},
        {"nm":"Remo en polea sentado agarre ancho", "rx":"3×8-10 RPS , RiR 1", "s":[]},
        {"nm":"Aperturas Bayesian abajo-arriba", "rx":"2×10-12 RPS , RiR 1", "s":[]},
        {"nm":"Press Francés Barra Z + Curl Bíceps Barra Z", "rx":"3×8-10 RPS , RiR 1", "s":[]},
        {"nm":"Ext. unilat. tríceps polea + Curl Bayesian", "rx":"2×10-12 RPS , RiR 1", "s":[]},
    ]},
    {"n":2, "type":"LEG A", "val":"BUENO", "exs": [
        {"nm":"Sentadilla Multipower", "rx":"3×7-9 RPS , RiR 1",
         "s":[{"r":8,"k":100,"i":1},{"r":9,"k":90,"i":1},{"r":7,"k":90,"i":1}]},
        {"nm":"Prensa", "rx":"3×10-12 RPS , RiR 1", "s":[]},
        {"nm":"Extensiones de Cuádriceps", "rx":"2×12-15 RPS , RiR 1",
         "s":[{"r":12,"k":100,"i":1},{"r":12,"k":95,"i":1}]},
        {"nm":"Curl Femoral Sentado", "rx":"3×8-10 RPS , RiR 1", "s":[]},
        {"nm":"Press Militar Neutro", "rx":"3×7-9 RPS , RiR 1", "s":[]},
        {"nm":"Elev. laterales mcna sobre banco", "rx":"3×12-15 RPS , RiR 1", "s":[]},
    ]},
    {"n":3, "type":"REST", "val":"BUENO", "exs": [
        {"nm":"ABS + Movilidad", "rx":"", "s":[]},
        {"nm":"Cardio a elegir (Caminar, bici, comba...)", "rx":"", "s":[]},
    ]},
    {"n":4, "type":"UPPER B", "val":"BUENO", "exs": [
        {"nm":"Curl Bíceps alterno de pie", "rx":"3×8-10 RPS , RiR 1",
         "s":[{"r":9,"k":15,"i":1},{"r":8,"k":15,"i":1},{"r":9,"k":12.5,"i":1}]},
        {"nm":"Kaz Press", "rx":"3×8-10 RPS , RiR 1",
         "s":[{"r":9,"k":12.5,"i":1},{"r":8,"k":12.5,"i":1},{"r":9,"k":10,"i":1}]},
        {"nm":"Curl Predicador Scott en polea", "rx":"2×10-12 RPS , RiR 1",
         "s":[{"r":11,"k":40,"i":1},{"r":10,"k":40,"i":1}]},
        {"nm":"Extensiones Katana con cuerda", "rx":"2×10-12 RPS , RiR 1",
         "s":[{"r":11,"k":40,"i":1},{"r":10,"k":40,"i":1}]},
        {"nm":"Jalón Alto Agarre U", "rx":"3×8-10 RPS , RiR 1",
         "s":[{"r":8,"k":70,"i":1},{"r":9,"k":65,"i":1},{"r":8,"k":65,"i":1}]},
        {"nm":"Press Inclinado Mancuernas", "rx":"3×8-10 RPS , RiR 1",
         "s":[{"r":8,"k":30,"i":1},{"r":9,"k":27.5,"i":1},{"r":8,"k":27.5,"i":1}]},
        {"nm":"Remo T agarre ancho", "rx":"3×8-10 RPS , RiR 1",
         "s":[{"r":8,"k":60,"i":1},{"r":8,"k":55,"i":1},{"r":8,"k":50,"i":1}]},
        {"nm":"Aperturas Bayesian Neutra", "rx":"2×12-15 RPS , RiR 1",
         "s":[{"r":13,"k":60,"i":1},{"r":12,"k":60,"i":1}]},
    ]},
    {"n":5, "type":"LEG B", "val":"BUENO", "exs": [
        {"nm":"Abducción + Aducción", "rx":"2×12-15 RPS , RiR 1",
         "s":[{"r":"12|12","k":68,"i":1},{"r":"13|13","k":61,"i":1}]},
        {"nm":"Peso Muerto Rumano", "rx":"1TS 5-7 RiR0 + 2BO 8-10 RiR1",
         "s":[{"r":5,"k":140,"i":0},{"r":9,"k":120,"i":1},{"r":8,"k":120,"i":1}]},
        {"nm":"Femoral Sentado", "rx":"3×8-10 RPS , RiR 1",
         "s":[{"r":9,"k":107,"i":1},{"r":9,"k":104,"i":1},{"r":9,"k":96,"i":1}]},
        {"nm":"Extensiones de Cuádriceps", "rx":"2×12-15 RPS , RiR 1", "s":[]},
        {"nm":"Elev. laterales pie en polea", "rx":"3×12-15 RPS , RiR 0-1",
         "s":[{"r":14,"k":10,"i":1},{"r":12,"k":10,"i":1},{"r":14,"k":7.5,"i":1}]},
        {"nm":"Press Militar Barra Multipower", "rx":"3×7-9 RPS , RiR 1",
         "s":[{"r":8,"k":30,"i":1},{"r":9,"k":20,"i":1},{"r":7,"k":20,"i":1}]},
        {"nm":"Elev. laterales sentado mcna (Finisher)", "rx":"2×20-25 RPS , RiR 1",
         "s":[{"r":22,"k":6,"i":1},{"r":21,"k":5,"i":1}]},
    ]},
    {"n":6, "type":"", "val":"", "exs": []},
]

NOTAS_EXTRA = [
    "Calentamiento + Movilidad: articulaciones con cuerpo/gomas",
    "Día 1: Planchas dinámicas 30-40 seg",
    "Día 2: Crunch Polea 2-3 Series + AB Wheel 3×15",
]

# ══════════════════════════════════════════════════════════════
# CREATE WORKBOOK
# ══════════════════════════════════════════════════════════════
wb = Workbook()

# Store day total row refs for dashboard cross-references
day_total_rows = []  # Will be filled during build

def add_logo(ws, row, col, w=45, h=45):
    try:
        img = XlImage(LOGO)
        img.width = w
        img.height = h
        ws.add_image(img, f"{get_column_letter(col)}{row}")
    except: pass

def brand_bar(ws, row, last_col, title_text, sub_text=""):
    ws.row_dimensions[row].height = 42 if row > 2 else 50
    afr(ws, row, 1, row, last_col, fill_dk)
    sc(ws, row, 2, "A-THERAPY", Font(name=FN, size=16 if row > 2 else 20, bold=True, color="FFFFFF"), fill_dk, Alignment(horizontal='left', vertical='center'))
    if sub_text:
        sc(ws, row, 5, sub_text, Font(name=FN, size=10, color="999999"), fill_dk, Alignment(horizontal='left', vertical='center'))
    add_logo(ws, row, last_col - 1, 40, 40)

# ══════════════════════════════════════════════════════════════
# SHEET 1: DASHBOARD
# ══════════════════════════════════════════════════════════════
wd = wb.active
wd.title = "DASHBOARD"
wd.sheet_properties.tabColor = P
wd.sheet_view.showGridLines = False

for c in range(1, 15):
    wd.column_dimensions[get_column_letter(c)].width = 14 if c > 1 else 3
wd.column_dimensions['B'].width = 18
wd.column_dimensions['C'].width = 16
wd.column_dimensions['D'].width = 16
wd.column_dimensions['E'].width = 16
wd.column_dimensions['F'].width = 16
wd.column_dimensions['G'].width = 3
wd.column_dimensions['H'].width = 22
wd.column_dimensions['I'].width = 22
wd.column_dimensions['J'].width = 22
wd.column_dimensions['K'].width = 22

wd.row_dimensions[1].height = 10
brand_bar(wd, 2, 14, "A-THERAPY", "SEGUIMIENTO DE ENTRENAMIENTO")
wd.row_dimensions[3].height = 8

# Info bar
sc(wd, 4, 2, "INFORMACIÓN GENERAL", ft(11, True, P), fill_w, align_l)
wd.row_dimensions[5].height = 28
info = [(2,3,"Cliente:"),(4,5,"Mesociclo:"),(6,7,"Semana:"),(8,9,"Peso Inicio:"),(10,11,"Peso Final:")]
for c1, c2, lbl in info:
    sc(wd, 5, c1, lbl, ft(9, True, N600), fill_inp, Alignment(horizontal='right', vertical='center'))
    sc(wd, 5, c2, "", ft(10), fill_inp, align_l)
    wd.cell(row=5, column=c2).border = Border(bottom=Side(style='thin', color=P))
wd.cell(row=5, column=5).value = MESO
wd.cell(row=5, column=7).value = SEM

dv_tipo_dash = DataValidation(type="list", formula1='LISTAS!$A$2:$A$11', allow_blank=True)
wd.add_data_validation(dv_tipo_dash)
dv_tipo_dash.add('C5')

# KPIs
sc(wd, 7, 2, "INDICADORES CLAVE", ft(11, True, P), fill_w, align_l)
wd.row_dimensions[8].height = 38
wd.row_dimensions[9].height = 18
wd.row_dimensions[10].height = 16

kpis = [("Sesiones","4 / 6","de 6 planificadas"),("Tonelaje Total","7.276 kg","volumen semanal"),
        ("RPE Medio","—","esfuerzo percibido"),("Mejora","—","vs. semana anterior")]
for i,(lbl,val,sub) in enumerate(kpis):
    c = 2 + i * 3
    ms(wd, 8, c, 8, c+1, val, Font(name=FN, size=22, bold=HB, color=P), fill_kpi, align_c)
    ms(wd, 9, c, 9, c+1, lbl, Font(name=FN, size=9, color=N600), fill_kpi, align_c)
    sc(wd, 10, c, sub, Font(name=FN, size=8, color=N600, italic=True), fill_kpi, align_c)

# Vitals
sc(wd, 12, 2, "ESTADO SEMANAL", ft(11, True, P), fill_w, align_l)
wd.row_dimensions[13].height = 24
vhdr = ["","Lun","Mar","Mié","Jue","Vie","Sáb","Dom"]
for i, h in enumerate(vhdr):
    sc(wd, 13, 2+i, h, Font(name=FN, size=9, bold=HB, color="FFFFFF"), fill_hdr, align_c)

vitals = [("Fatiga", 1,1,1,1,7,7),("Agujetas", 1,1,1,1,8,None),("Motivación", 1,1,1,1,7,7),
          ("Horas Sueño", 7,7,7,7,None,None),("Calidad Sueño", 6,6,6,6,None,None)]
for vi, (vn, *vals) in enumerate(vitals):
    r = 14 + vi
    wd.row_dimensions[r].height = 22
    bg = fill_w if vi % 2 == 0 else fill_a
    sc(wd, r, 2, vn, ft(9, True), bg, align_l)
    for di, v in enumerate(vals):
        sc(wd, r, 3+di, v if v is not None else "", ft(10), bg, align_c)

# Add 1-10 validation to vitals
dv_vit = DataValidation(type="list", formula1='LISTAS!$C$2:$C$11', allow_blank=True)
wd.add_data_validation(dv_vit)
for vi in range(5):
    for di in range(7):
        dv_vit.add(f'{get_column_letter(3+di)}{14+vi}')

# Session summary
sc(wd, 20, 2, "RESUMEN DE SESIONES", ft(11, True, P), fill_w, align_l)
wd.row_dimensions[21].height = 24
shdr = ["Día","Tipo","Val.","Ejerc.","Tonelaje","Max KG"]
for i, h in enumerate(shdr):
    sc(wd, 21, 2+i, h, Font(name=FN, size=9, bold=HB, color="FFFFFF"), fill_hdr, align_c)

for di, day in enumerate(DAYS):
    r = 22 + di
    wd.row_dimensions[r].height = 22
    bg = fill_w if di % 2 == 0 else fill_a
    sc(wd, r, 2, f"Día {day['n']}", ft(10), bg, align_c)
    tbg = fill_amb if day['type'] == 'REST' else bg
    sc(wd, r, 3, day['type'] or "—", ft(10, True), tbg, align_c)
    sc(wd, r, 4, day['val'] or "—", ft(10), bg, align_c)
    sc(wd, r, 5, len(day['exs']), ft(10), bg, align_c)
    tt, mk = 0, 0
    for ex in day['exs']:
        for s in ex['s']:
            if isinstance(s.get('r'), (int, float)) and isinstance(s.get('k'), (int, float)):
                tt += s['r'] * s['k']
                if s['k'] > mk: mk = s['k']
    sc(wd, r, 6, f"{tt:,.0f} kg" if tt > 0 else "—", ft(10), bg, align_r)
    sc(wd, r, 7, f"{mk:,.1f} kg" if mk > 0 else "—", ft(10), bg, align_r)

# Notes
wd.row_dimensions[29].height = 12
sc(wd, 30, 2, "NOTAS DEL ENTRENADOR", ft(11, True, P), fill_w, align_l)
wd.row_dimensions[31].height = 45
ms(wd, 31, 2, 31, 13, "", ft(10), fill_inp, align_lt)
for c in range(2, 14):
    wd.cell(row=31, column=c).border = Border(bottom=Side(style='thin', color=P))

sc(wd, 33, 2, "A-THERAPY  ,  Fuerza , Ciencia , Rendimiento", Font(name=FN, size=8, color=N600, italic=True), fill_w, align_l)
wd.freeze_panes = 'A3'

# ══════════════════════════════════════════════════════════════
# SHEET 2: REGISTRO SEMANAL
# ══════════════════════════════════════════════════════════════
wr = wb.create_sheet("REGISTRO SEMANAL")
wr.sheet_properties.tabColor = P
wr.sheet_view.showGridLines = False

# Column layout: A=margin, B=#, C=Ejercicio, D=Prescripción
# EFG=S1(RPS,KGS,RIR), HIJ=S2, KLM=S3, NOP=S4, QRS=S5, T=Tonelaje, U=MaxKG
# V=spacer, W-Z=meta area
for cl, w in {'A':2.5,'B':4,'C':30,'D':20}.items():
    wr.column_dimensions[cl].width = w
for si in range(5):
    bc = 5 + si * 3
    for j, cl in enumerate(get_column_letter(bc+j) for j in range(3)):
        wr.column_dimensions[cl].width = [8, 8, 7][j]
wr.column_dimensions['T'].width = 13
wr.column_dimensions['U'].width = 9
wr.column_dimensions['V'].width = 2
wr.column_dimensions['W'].width = 14
wr.column_dimensions['X'].width = 14
wr.column_dimensions['Y'].width = 14
wr.column_dimensions['Z'].width = 30

wr.freeze_panes = 'C5'
wr.row_dimensions[1].height = 8
brand_bar(wr, 2, 26, "A-THERAPY", "REGISTRO SEMANAL DE ENTRENAMIENTO")

# Info bar
wr.row_dimensions[3].height = 26
afr(wr, 3, 1, 3, 26, fill_sec)
for i, (lbl, val) in enumerate([("Mesociclo:", MESO), ("Semana:", SEM), ("Peso Inicio:", ""), ("Peso Final:", "")]):
    c = 2 + i * 6
    sc(wr, 3, c, lbl, ft(9, True, N600), fill_sec, Alignment(horizontal='right', vertical='center'))
    sc(wr, 3, c+1, val, ft(10, True, P), fill_sec, align_c)
    wr.cell(row=3, column=c+1).border = Border(bottom=Side(style='thin', color=P))

# Improved?
sc(wr, 3, 22, "¿Mejora?", ft(9, True, N600), fill_sec, Alignment(horizontal='right', vertical='center'))
sc(wr, 3, 23, "", ft(10, True, P), fill_sec, align_c)
dv_yn = DataValidation(type="list", formula1='LISTAS!$E$2:$E$3', allow_blank=True)
wr.add_data_validation(dv_yn)
dv_yn.add('W3')

# Vitals compact
wr.row_dimensions[4].height = 22
vcompact = ["Fatiga","Agujetas","Motivación","Sueño(h)","Calidad"]
for i, vn in enumerate(vcompact):
    c = 2 + i * 5
    sc(wr, 4, c, vn, ft(8, True, N600), fill_w, align_l)
    sc(wr, 4, c+1, "", ft(9), fill_inp, align_c)
    wr.cell(row=4, column=c+1).border = Border(bottom=Side(style='thin', color=P))
dv_vit2 = DataValidation(type="list", formula1='LISTAS!$C$2:$C$11', allow_blank=True)
wr.add_data_validation(dv_vit2)
for i in range(5):
    dv_vit2.add(f'{get_column_letter(3+i*5)}4')

wr.row_dimensions[5].height = 4  # spacer

def build_day(ws, sr, day):
    """Build one day block starting at row sr. Returns next row."""
    r = sr
    is_rest = day['type'] == 'REST'
    dbg = fill_rest if is_rest else fill_hdr
    
    # Day header
    ws.row_dimensions[r].height = 26
    afr(ws, r, 1, r, 21, dbg)
    lbl = f"DÍA {day['n']}"
    if day['type']: lbl += f"  ,  {day['type']}"
    sc(ws, r, 2, lbl, Font(name=FN, size=11, bold=True, color="FFFFFF"), dbg, align_l)
    sc(ws, r, 13, "Fecha:", Font(name=FN, size=9, bold=True, color="FFFFFF"), dbg, Alignment(horizontal='right', vertical='center'))
    sc(ws, r, 14, "", Font(name=FN, size=9, color="FFFFFF"), dbg, align_c)
    sc(ws, r, 16, "Valoración:", Font(name=FN, size=9, bold=True, color="FFFFFF"), dbg, Alignment(horizontal='right', vertical='center'))
    sc(ws, r, 17, day['val'] if day['val'] else "", Font(name=FN, size=9, bold=True, color="FFFFFF"), dbg, align_c)
    r += 1
    
    # Exercise header
    ws.row_dimensions[r].height = 20
    sc(ws, r, 2, "#", Font(name=FN, size=8, bold=HB, color="FFFFFF"), fill_hdr, align_c)
    sc(ws, r, 3, "EJERCICIO", Font(name=FN, size=8, bold=HB, color="FFFFFF"), fill_hdr, align_c)
    sc(ws, r, 4, "PRESCRIPCIÓN", Font(name=FN, size=8, bold=HB, color="FFFFFF"), fill_hdr, align_c)
    for si in range(5):
        bc = 5 + si * 3
        ms(ws, r, bc, r, bc+2, f"SERIE {si+1}", Font(name=FN, size=7, bold=HB, color="FFFFFF"), fill_hdr, align_c)
    sc(ws, r, 20, "TONELAJE", Font(name=FN, size=8, bold=HB, color="FFFFFF"), fill_hdr, align_c)
    sc(ws, r, 21, "MAX", Font(name=FN, size=8, bold=HB, color="FFFFFF"), fill_hdr, align_c)
    r += 1
    
    # Sub-header for series columns
    ws.row_dimensions[r].height = 16
    sc(ws, r, 2, "", ft(7), fill_lg, align_c)
    sc(ws, r, 3, "", ft(7), fill_lg, align_c)
    sc(ws, r, 4, "", ft(7), fill_lg, align_c)
    for si in range(5):
        bc = 5 + si * 3
        sc(ws, r, bc, "RPS", Font(name=FN, size=7, bold=HB, color=P), fill_lg, align_c)
        sc(ws, r, bc+1, "KGS", Font(name=FN, size=7, bold=HB, color=P), fill_lg, align_c)
        sc(ws, r, bc+2, "RIR", Font(name=FN, size=7, bold=HB, color=P), fill_lg, align_c)
    sc(ws, r, 20, "", ft(7), fill_lg, align_c)
    sc(ws, r, 21, "", ft(7), fill_lg, align_c)
    r += 1
    
    first_ex_r = r
    
    # Exercise rows
    for ei, ex in enumerate(day['exs']):
        ws.row_dimensions[r].height = 22
        bg = fill_w if ei % 2 == 0 else fill_a
        afr(ws, r, 1, r, 21, bg)
        sc(ws, r, 2, ei+1, ft(9), bg, align_c)
        sc(ws, r, 3, ex['nm'], ft(9), bg, align_l)
        sc(ws, r, 4, ex['rx'], Font(name=FN, size=8, color=N600), bg, align_c)
        
        for si in range(5):
            bc = 5 + si * 3
            if si < len(ex['s']):
                s = ex['s'][si]
                sc(ws, r, bc, s['r'] if s['r'] is not None else "", ft(9), bg, align_c)
                sc(ws, r, bc+1, s['k'] if s['k'] is not None else "", ft(9), bg, align_c)
                sc(ws, r, bc+2, s['i'] if s['i'] is not None else "", ft(9), bg, align_c)
            else:
                for j in range(3):
                    sc(ws, r, bc+j, "", ft(8), bg, align_c)
        
        # Tonelaje formula
        tp = []
        for si in range(5):
            rc = get_column_letter(5 + si*3)
            kc = get_column_letter(5 + si*3 + 1)
            tp.append(f"IFERROR({rc}{r}*{kc}{r},0)")
        sc(ws, r, 20, "=" + "+".join(tp), ft(9), bg, align_r, nf='#,##0')
        
        # Max KG formula
        mp = [get_column_letter(5+si*3+1)+str(r) for si in range(5)]
        sc(ws, r, 21, f"=IFERROR(MAX({','.join(mp)}),0)", ft(9), bg, align_r, nf='#,##0.0')
        r += 1
    
    # Extra empty rows (3 more)
    for extra in range(3):
        ws.row_dimensions[r].height = 22
        bg = fill_w if (len(day['exs'])+extra) % 2 == 0 else fill_a
        afr(ws, r, 1, r, 21, bg)
        sc(ws, r, 2, len(day['exs'])+extra+1, ft(9), bg, align_c)
        for si in range(5):
            bc = 5 + si*3
            for j in range(3):
                sc(ws, r, bc+j, "", ft(8), bg, align_c)
        tp = []
        for si in range(5):
            rc = get_column_letter(5+si*3)
            kc = get_column_letter(5+si*3+1)
            tp.append(f"IFERROR({rc}{r}*{kc}{r},0)")
        sc(ws, r, 20, "="+"+".join(tp), ft(9), bg, align_r, nf='#,##0')
        mp = [get_column_letter(5+si*3+1)+str(r) for si in range(5)]
        sc(ws, r, 21, f"=IFERROR(MAX({','.join(mp)}),0)", ft(9), bg, align_r, nf='#,##0.0')
        r += 1
    
    last_ex_r = r - 1
    
    # Total row
    ws.row_dimensions[r].height = 24
    afr(ws, r, 1, r, 21, fill_lg)
    sc(ws, r, 3, "TOTAL DÍA", ft(9, True, P), fill_lg, align_l)
    sc(ws, r, 20, f"=SUM(T{first_ex_r}:T{last_ex_r})", ft(10, True, P), fill_lg, align_r, nf='#,##0')
    sc(ws, r, 21, f"=IFERROR(MAX(U{first_ex_r}:U{last_ex_r}),0)", ft(10, True, P), fill_lg, align_r, nf='#,##0.0')
    r += 1
    
    # PRS / RPE / Notes
    ws.row_dimensions[r].height = 26
    afr(ws, r, 1, r, 21, fill_sec)
    sc(ws, r, 2, "Readiness (PRS):", ft(9, True, N600), fill_sec, Alignment(horizontal='right', vertical='center'))
    sc(ws, r, 4, "", ft(11, True, P), fill_sec, align_c)
    sc(ws, r, 6, "RPE Post-Entreno:", ft(9, True, N600), fill_sec, Alignment(horizontal='right', vertical='center'))
    sc(ws, r, 8, "", ft(11, True, P), fill_sec, align_c)
    sc(ws, r, 10, "Notas:", ft(9, True, N600), fill_sec, Alignment(horizontal='right', vertical='center'))
    ms(ws, r, 11, r, 21, "", ft(9), fill_sec, Alignment(horizontal='left', vertical='center', wrap_text=True))
    r += 1
    
    # Spacer
    ws.row_dimensions[r].height = 6
    afr(ws, r, 1, r, 21, fill_w)
    r += 1
    
    return r

# Build all days
row = 6
for day in DAYS:
    row = build_day(wr, row, day)

# Additional notes
sc(wr, row, 2, "INSTRUCCIONES", ft(10, True, P), fill_w, align_l)
row += 1
for note in NOTAS_EXTRA:
    wr.row_dimensions[row].height = 18
    sc(wr, row, 2, f", {note}", Font(name=FN, size=8, color=N600), fill_w, align_l)
    row += 1

# Data validations for registro
dv_rir = DataValidation(type="list", formula1='LISTAS!$D$2:$D$8', allow_blank=True)
wr.add_data_validation(dv_rir)
dv_1_10 = DataValidation(type="list", formula1='LISTAS!$C$2:$C$11', allow_blank=True)
wr.add_data_validation(dv_1_10)
dv_val = DataValidation(type="list", formula1='LISTAS!$B$2:$B$5', allow_blank=True)
wr.add_data_validation(dv_val)

wr.sheet_view.zoomScale = 90

# ══════════════════════════════════════════════════════════════
# SHEET 3: EVOLUCIÓN
# ══════════════════════════════════════════════════════════════
we = wb.create_sheet("EVOLUCIÓN")
we.sheet_properties.tabColor = P
we.sheet_view.showGridLines = False

for cl, w in {'A':3,'B':10,'C':13,'D':12,'E':12,'F':12,'G':12,'H':12,'I':12,'J':12,'K':12,'L':12,'M':12,'N':14,'O':16}.items():
    we.column_dimensions[cl].width = w

we.row_dimensions[1].height = 8
brand_bar(we, 2, 15, "A-THERAPY", "EVOLUCIÓN Y PROGRESIÓN")

# --- Weight Tracking ---
sc(we, 4, 2, "PESO CORPORAL", ft(11, True, P), fill_w, align_l)
we.row_dimensions[5].height = 24
for i, h in enumerate(["Semana","Peso (kg)","Δ vs Ant.","% Cambio","Objetivo","Desviación"]):
    sc(we, 5, 2+i, h, Font(name=FN, size=9, bold=HB, color="FFFFFF"), fill_hdr, align_c)

for wi in range(8):
    r = 6 + wi
    we.row_dimensions[r].height = 22
    bg = fill_w if wi % 2 == 0 else fill_a
    sc(we, r, 2, wi+1, ft(10), bg, align_c)
    ibg = fill_inp if wi == 0 else bg
    sc(we, r, 3, "", ft(10), ibg, align_c)
    we.cell(row=r, column=3).border = Border(bottom=Side(style='thin', color=P)) if wi == 0 else Border()
    if wi > 0:
        sc(we, r, 4, f'=IFERROR(C{r}-C{r-1},"")', ft(10), bg, align_r, nf='+0.0;-0.0;0')
        sc(we, r, 5, f'=IFERROR((C{r}-C{r-1})/C{r-1},"")', ft(10), bg, align_r, nf='0.0%')
    else:
        sc(we, r, 4, "—", ft(10), bg, align_c)
        sc(we, r, 5, "—", ft(10), bg, align_c)
    sc(we, r, 6, "", ft(10), bg, align_c)
    sc(we, r, 7, f'=IFERROR(C{r}-F{r},"")', ft(10), bg, align_r, nf='+0.0;-0.0;0')

# --- Main Lifts ---
sc(we, 15, 2, "ELEVACIONES PRINCIPALES (KG)", ft(11, True, P), fill_w, align_l)
we.row_dimensions[16].height = 24
lifts = ["Sentadilla","Press Banca","Peso Muerto","Jalón Alto","Press Militar"]
for i, h in enumerate(["Ejercicio"] + [f"S{i+1}" for i in range(8)]):
    sc(we, 16, 2+i, h, Font(name=FN, size=9, bold=HB, color="FFFFFF"), fill_hdr, align_c)

for li, lift in enumerate(lifts):
    r = 17 + li
    we.row_dimensions[r].height = 22
    bg = fill_w if li % 2 == 0 else fill_a
    sc(we, r, 2, lift, ft(10, True), bg, align_l)
    for si in range(8):
        ibg = fill_inp if si == 0 else bg
    val = 100 if li == 0 and si == 0 else ""
    sc(we, r, 3+si, val, ft(10), ibg, align_c)
    if si == 0:
        we.cell(row=r, column=3).border = Border(bottom=Side(style='thin', color=P))

# --- Volume Chart Data ---
sc(we, 23, 2, "VOLUMEN SEMANAL (TONELAJE TOTAL KG)", ft(11, True, P), fill_w, align_l)
we.row_dimensions[24].height = 24
for i, h in enumerate(["Semana"] + [f"S{i+1}" for i in range(8)]):
    sc(we, 24, 2+i, h, Font(name=FN, size=9, bold=HB, color="FFFFFF"), fill_hdr, align_c)
we.row_dimensions[25].height = 22
sc(we, 25, 2, "Tonelaje", ft(10, True), fill_w, align_l)
sc(we, 25, 3, 7276, ft(11, True, P), fill_inp, align_r, nf='#,##0')
for si in range(1, 8):
    bg = fill_a if si % 2 == 1 else fill_w
    sc(we, 25, 3+si, "", ft(10), bg, align_r, nf='#,##0')

# --- Volume Bar Chart ---
chart1 = base.create_bar_chart(width=22, height=10, gap_width=60)
data1 = Reference(we, min_col=3, max_col=10, min_row=25)
cats1 = Reference(we, min_col=3, max_col=10, min_row=24)
chart1.add_data(data1, from_rows=True, titles_from_data=False)
chart1.set_categories(cats1)
chart1.series[0].tx = SeriesLabel(v="Tonelaje")
base.apply_chart_colors(chart1)
base.setup_chart_titles(chart1, title="Volumen Semanal (Tonelaje)", y_title="Tonelaje (kg)", x_title="Semana")
chart1.legend = None
we.add_chart(chart1, "B27")

# --- RPE Tracking ---
sc(we, 42, 2, "RPE MEDIO POR SEMANA", ft(11, True, P), fill_w, align_l)
we.row_dimensions[43].height = 24
for i, h in enumerate(["Semana"] + [f"S{i+1}" for i in range(8)]):
    sc(we, 43, 2+i, h, Font(name=FN, size=9, bold=HB, color="FFFFFF"), fill_hdr, align_c)
we.row_dimensions[44].height = 22
sc(we, 44, 2, "RPE Medio", ft(10, True), fill_w, align_l)
for si in range(8):
    bg = fill_a if si % 2 == 1 else fill_w
    ibg = fill_inp if si == 0 else bg
    sc(we, 44, 3+si, "", ft(10), ibg, align_c, nf='0.0')
    if si == 0:
        we.cell(row=44, column=3).border = Border(bottom=Side(style='thin', color=P))

# --- RPE Line Chart ---
chart2 = base.create_line_chart(width=22, height=10)
data2 = Reference(we, min_col=3, max_col=10, min_row=44)
cats2 = Reference(we, min_col=3, max_col=10, min_row=43)
chart2.add_data(data2, from_rows=True, titles_from_data=False)
chart2.set_categories(cats2)
chart2.series[0].tx = SeriesLabel(v="RPE Medio")
base.apply_chart_colors(chart2)
base.setup_chart_titles(chart2, title="Evolución RPE", y_title="RPE", x_title="Semana")
chart2.y_axis.scaling.min = 1
chart2.y_axis.scaling.max = 10
chart2.legend = None
we.add_chart(chart2, "B46")

# --- Main Lifts Line Chart ---
chart3 = base.create_line_chart(width=22, height=12)
for li in range(5):
    data_row = 17 + li
    data3 = Reference(we, min_col=3, max_col=10, min_row=data_row)
    chart3.add_data(data3, from_rows=True, titles_from_data=False)
    chart3.series[li].tx = SeriesLabel(v=lifts[li])

cats3 = Reference(we, min_col=3, max_col=10, min_row=16)
chart3.set_categories(cats3)
base.apply_chart_colors(chart3)
base.setup_chart_titles(chart3, title="Progresión Elevaciones Principales", y_title="KG", x_title="Semana")
we.add_chart(chart3, "B62")

sc(we, 78, 2, "A-THERAPY  ,  Fuerza , Ciencia , Rendimiento", Font(name=FN, size=8, color=N600, italic=True), fill_w, align_l)
we.freeze_panes = 'C6'

# ══════════════════════════════════════════════════════════════
# SHEET 4: LISTAS
# ══════════════════════════════════════════════════════════════
wl = wb.create_sheet("LISTAS")
wl.sheet_view.showGridLines = False

lists = {
    'A': ("Tipo Entreno", ["Upper A","Upper B","LEG A","LEG B","Full Body","PUSH","PULL","REST","Movilidad","Cardio"]),
    'B': ("Valoración", ["BUENO","REGULAR","MALO","EXCEPCIONAL"]),
    'C': ("Escala 1-10", [str(i) for i in range(1,11)]),
    'D': ("RIR", ["0","0-1","1","1-2","2","2-3","3"]),
    'E': ("Sí/No", ["SI","NO"]),
}

for ci, (col, (hdr, vals)) in enumerate(lists.items()):
    c = ci + 1
    wl.column_dimensions[get_column_letter(c)].width = 16
    sc(wl, 1, c, hdr, Font(name=FN, size=9, bold=HB, color="FFFFFF"), fill_hdr, align_c)
    for vi, v in enumerate(vals):
        bg = fill_w if vi % 2 == 0 else fill_a
        sc(wl, 2+vi, c, v, ft(10), bg, align_c)

# ══════════════════════════════════════════════════════════════
# FINAL
# ══════════════════════════════════════════════════════════════
wb.active = 0
for ws in [wd, wr, we, wl]:
    ws.page_setup.orientation = 'landscape'
    ws.page_setup.fitToWidth = 1
    ws.page_setup.fitToHeight = 0

wb.properties.creator = "A-THERAPY"
wb.properties.title = "A-THERAPY Seguimiento Profesional"
wb.save(OUTPUT)

print(f"✅ Excel generado: {OUTPUT}")
print(f"   Hojas: {', '.join(ws.title for ws in wb.worksheets)}")
print(f"   Paleta: {base.get_active_style()}")
print(f"   Ejercicios: {sum(len(d['exs']) for d in DAYS)}")
print(f"   Datos con series: {sum(sum(1 for e in d['exs'] for s in e['s'] if s) for d in DAYS)} series")
