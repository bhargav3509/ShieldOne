import os
import shutil
from pptx import Presentation
from pptx.util import Inches, Pt
from pptx.enum.text import PP_ALIGN
from pptx.dml.color import RGBColor
from pptx.enum.shapes import MSO_SHAPE

def build_presentation():
    prs = Presentation()
    prs.slide_width = Inches(13.333)
    prs.slide_height = Inches(7.5)
    blank_layout = prs.slide_layouts[6]  # Blank slide

    # ── Color Palette ──────────────────────────────────────────────
    COLOR_BG = RGBColor(255, 255, 255)
    COLOR_NAVY = RGBColor(15, 23, 42)         # #0F172A
    COLOR_BLUE = RGBColor(37, 99, 235)        # #2563EB
    COLOR_INDIGO = RGBColor(79, 70, 229)      # #4F46E5
    COLOR_DARK_BLUE = RGBColor(30, 58, 138)   # #1E3A8A
    COLOR_BODY = RGBColor(51, 65, 85)         # #334155
    COLOR_MUTED = RGBColor(100, 116, 139)     # #64748B
    COLOR_PANEL = RGBColor(248, 250, 252)     # #F8FAFC
    COLOR_PANEL_ALT = RGBColor(241, 245, 249) # #F1F5F9
    COLOR_BORDER = RGBColor(203, 213, 225)    # #CBD5E1
    COLOR_LIGHT_BLUE = RGBColor(239, 246, 255)# #EFF6FF
    COLOR_BORDER_BLUE = RGBColor(191, 219, 254)# #BFDBFE
    COLOR_GREEN = RGBColor(16, 185, 129)      # #10B981
    COLOR_LIGHT_GREEN = RGBColor(236, 253, 245)# #ECFDF5
    COLOR_RED = RGBColor(239, 68, 68)         # #EF4444
    COLOR_LIGHT_RED = RGBColor(254, 242, 242) # #FEF2F2

    dashboard_img = r"d:\projects\soc-project\presentation\dashboard_preview.png"

    # Helper: Consistent slide header
    def add_header(slide, title_text, category_text, slide_num):
        # Top gradient-like accent bar
        top_bar = slide.shapes.add_shape(MSO_SHAPE.RECTANGLE, Inches(0), Inches(0), Inches(13.333), Inches(0.09))
        top_bar.fill.solid()
        top_bar.fill.fore_color.rgb = COLOR_BLUE
        top_bar.line.color.rgb = COLOR_BLUE

        # Top branding text
        header_box = slide.shapes.add_textbox(Inches(0.8), Inches(0.35), Inches(8.0), Inches(0.35))
        tf = header_box.text_frame
        tf.word_wrap = True
        tf.margin_left = tf.margin_top = tf.margin_right = tf.margin_bottom = 0
        p = tf.paragraphs[0]
        p.text = "SHIELDONE  |  AI-POWERED CYBER DEFENSE & THREAT INTELLIGENCE"
        p.font.size = Pt(9.0)
        p.font.bold = True
        p.font.color.rgb = COLOR_BLUE
        p.font.name = "Arial"

        # Slide Number Badge
        slide_num_box = slide.shapes.add_textbox(Inches(10.5), Inches(0.35), Inches(2.033), Inches(0.35))
        tf_num = slide_num_box.text_frame
        tf_num.word_wrap = True
        tf_num.margin_left = tf_num.margin_top = tf_num.margin_right = tf_num.margin_bottom = 0
        p_num = tf_num.paragraphs[0]
        p_num.text = f"Slide {slide_num} of 8"
        p_num.alignment = PP_ALIGN.RIGHT
        p_num.font.size = Pt(9.5)
        p_num.font.bold = True
        p_num.font.color.rgb = COLOR_MUTED
        p_num.font.name = "Arial"

        # Kicker & Main Title
        title_box = slide.shapes.add_textbox(Inches(0.8), Inches(0.72), Inches(11.733), Inches(0.95))
        tf_t = title_box.text_frame
        tf_t.word_wrap = True
        tf_t.margin_left = tf_t.margin_top = tf_t.margin_right = tf_t.margin_bottom = 0
        
        p_kicker = tf_t.paragraphs[0]
        p_kicker.text = category_text.upper()
        p_kicker.font.size = Pt(8.5)
        p_kicker.font.bold = True
        p_kicker.font.color.rgb = COLOR_BLUE
        p_kicker.font.name = "Arial"

        p_main = tf_t.add_paragraph()
        p_main.text = title_text
        p_main.font.size = Pt(21)
        p_main.font.bold = True
        p_main.font.color.rgb = COLOR_NAVY
        p_main.font.name = "Arial"

        # Accent underline
        line = slide.shapes.add_shape(MSO_SHAPE.RECTANGLE, Inches(0.8), Inches(1.68), Inches(0.8), Inches(0.04))
        line.fill.solid()
        line.fill.fore_color.rgb = COLOR_BLUE
        line.line.color.rgb = COLOR_BLUE

    # =========================================================================
    # SLIDE 1: TITLE & TEAM NAME / ID — YOUR SOLUTION IN ONE LINE
    # =========================================================================
    slide1 = prs.slides.add_slide(blank_layout)
    
    # Top accent bar
    top_bar1 = slide1.shapes.add_shape(MSO_SHAPE.RECTANGLE, Inches(0), Inches(0), Inches(13.333), Inches(0.12))
    top_bar1.fill.solid()
    top_bar1.fill.fore_color.rgb = COLOR_BLUE
    top_bar1.line.color.rgb = COLOR_BLUE

    # Pill tag
    cat_shape = slide1.shapes.add_shape(MSO_SHAPE.ROUNDED_RECTANGLE, Inches(4.3), Inches(1.1), Inches(4.733), Inches(0.42))
    cat_shape.fill.solid()
    cat_shape.fill.fore_color.rgb = COLOR_PANEL_ALT
    cat_shape.line.color.rgb = COLOR_BORDER
    tf_cat = cat_shape.text_frame
    tf_cat.word_wrap = True
    p_c = tf_cat.paragraphs[0]
    p_c.text = "ACADEMIC CAPSTONE & DEFENSE PRESENTATION"
    p_c.alignment = PP_ALIGN.CENTER
    p_c.font.size = Pt(9.5)
    p_c.font.bold = True
    p_c.font.color.rgb = COLOR_NAVY
    p_c.font.name = "Arial"

    # Main Title Box
    tbox = slide1.shapes.add_textbox(Inches(1.2), Inches(1.75), Inches(10.933), Inches(2.3))
    tf1 = tbox.text_frame
    tf1.word_wrap = True
    
    p1 = tf1.paragraphs[0]
    p1.text = "ShieldOne"
    p1.alignment = PP_ALIGN.CENTER
    p1.font.size = Pt(50)
    p1.font.bold = True
    p1.font.color.rgb = COLOR_NAVY
    p1.font.name = "Arial"

    p2 = tf1.add_paragraph()
    p2.text = "Next-Generation Cyber Defense & Real-Time Threat Intelligence Platform"
    p2.alignment = PP_ALIGN.CENTER
    p2.font.size = Pt(16.5)
    p2.font.bold = True
    p2.font.color.rgb = COLOR_BLUE
    p2.font.name = "Arial"
    p2.space_before = Pt(6)

    # Solution In One Line Callout Box
    sol_box = slide1.shapes.add_shape(MSO_SHAPE.RECTANGLE, Inches(2.2), Inches(3.75), Inches(8.933), Inches(1.05))
    sol_box.fill.solid()
    sol_box.fill.fore_color.rgb = COLOR_LIGHT_BLUE
    sol_box.line.color.rgb = COLOR_BORDER_BLUE

    tf_sol = sol_box.text_frame
    tf_sol.word_wrap = True
    p_sol_label = tf_sol.paragraphs[0]
    p_sol_label.text = "OUR SOLUTION IN ONE LINE"
    p_sol_label.alignment = PP_ALIGN.CENTER
    p_sol_label.font.size = Pt(9.0)
    p_sol_label.font.bold = True
    p_sol_label.font.color.rgb = COLOR_BLUE
    p_sol_label.font.name = "Arial"

    p_sol_text = tf_sol.add_paragraph()
    p_sol_text.text = "“Democratizing cybersecurity by unifying enterprise-grade SOC threat telemetry with AI-powered personal scam defense on a single real-time platform.”"
    p_sol_text.alignment = PP_ALIGN.CENTER
    p_sol_text.font.size = Pt(12.5)
    p_sol_text.font.bold = True
    p_sol_text.font.color.rgb = COLOR_NAVY
    p_sol_text.font.name = "Arial"
    p_sol_text.space_before = Pt(4)

    # Presenter & Team Card
    card1 = slide1.shapes.add_shape(MSO_SHAPE.RECTANGLE, Inches(2.8), Inches(5.15), Inches(7.733), Inches(1.4))
    card1.fill.solid()
    card1.fill.fore_color.rgb = COLOR_PANEL
    card1.line.color.rgb = COLOR_BORDER

    p_box = slide1.shapes.add_textbox(Inches(3.0), Inches(5.3), Inches(7.333), Inches(1.1))
    tf_p = p_box.text_frame
    tf_p.word_wrap = True

    p_head = tf_p.paragraphs[0]
    p_head.text = "PROJECT LEAD / PRESENTER                  UID                                SECTION                  EMAIL"
    p_head.font.size = Pt(9.0)
    p_head.font.bold = True
    p_head.font.color.rgb = COLOR_MUTED
    p_head.font.name = "Arial"

    p_val = tf_p.add_paragraph()
    p_val.text = "Bhargav                                          24BCS11028                  803A                       bhargav3509@gmail.com"
    p_val.font.size = Pt(13.0)
    p_val.font.bold = True
    p_val.font.color.rgb = COLOR_NAVY
    p_val.font.name = "Arial"
    p_val.space_before = Pt(6)

    # Tech Badges below
    badge_box = slide1.shapes.add_textbox(Inches(2.8), Inches(6.7), Inches(7.733), Inches(0.4))
    tf_b = badge_box.text_frame
    tf_b.word_wrap = True
    p_b = tf_b.paragraphs[0]
    p_b.text = "Core Tech: React 19 • Node.js • Socket.io WebSockets • Leaflet Maps • Google Gemini 2.5 Flash • 5 Global Feeds"
    p_b.alignment = PP_ALIGN.CENTER
    p_b.font.size = Pt(9.0)
    p_b.font.color.rgb = COLOR_MUTED
    p_b.font.name = "Arial"

    # =========================================================================
    # SLIDE 2: THE PROBLEM — WHO IS STRUGGLING AND WHY?
    # =========================================================================
    slide2 = prs.slides.add_slide(blank_layout)
    add_header(slide2, "The Cybersecurity Crisis: Who Is Struggling and Why?", "Problem Analysis & Industry Gap", 2)

    # Left Box: Enterprise SOC Pain Points
    left_card = slide2.shapes.add_shape(MSO_SHAPE.RECTANGLE, Inches(0.8), Inches(1.95), Inches(5.7), Inches(5.0))
    left_card.fill.solid()
    left_card.fill.fore_color.rgb = COLOR_PANEL
    left_card.line.color.rgb = COLOR_BORDER

    # Red top accent strip
    r_strip = slide2.shapes.add_shape(MSO_SHAPE.RECTANGLE, Inches(0.8), Inches(1.95), Inches(5.7), Inches(0.08))
    r_strip.fill.solid()
    r_strip.fill.fore_color.rgb = COLOR_RED
    r_strip.line.color.rgb = COLOR_RED

    tb_left = slide2.shapes.add_textbox(Inches(1.05), Inches(2.15), Inches(5.2), Inches(4.6))
    tf_l = tb_left.text_frame
    tf_l.word_wrap = True
    
    pl_title = tf_l.paragraphs[0]
    pl_title.text = "1. ENTERPRISES & SOC ANALYSTS"
    pl_title.font.size = Pt(12)
    pl_title.font.bold = True
    pl_title.font.color.rgb = COLOR_RED
    pl_title.font.name = "Arial"

    pl_sub = tf_l.add_paragraph()
    pl_sub.text = "Overwhelmed by complexity, alert fatigue, and delayed response times."
    pl_sub.font.size = Pt(9.5)
    pl_sub.font.color.rgb = COLOR_MUTED
    pl_sub.font.name = "Arial"
    pl_sub.space_after = Pt(12)

    ent_problems = [
        ("Massive Alert Fatigue:", "SOC analysts parse thousands of daily events. Over 60% of alerts are false positives or lack severity scoring."),
        ("Fragmented Threat Feeds:", "Crucial intelligence is siloed across disparate feeds (Abuse.ch, CISA, SANS) with no unified correlation."),
        ("High MTTD & MTTR:", "Mean-Time-To-Detect and Mean-Time-To-Respond remain dangerously high; tier-1 analysts struggle with slow manual triage."),
        ("Compliance Overhead:", "Auditing against SOC 2, ISO 27001, and GDPR requires labor-intensive manual evidence collection.")
    ]
    for bold_txt, norm_txt in ent_problems:
        p_item = tf_l.add_paragraph()
        p_item.space_after = Pt(9)
        p_item.font.size = Pt(10.0)
        p_item.font.name = "Arial"
        
        run_b = p_item.add_run()
        run_b.text = "•  " + bold_txt + " "
        run_b.font.bold = True
        run_b.font.color.rgb = COLOR_NAVY
        
        run_n = p_item.add_run()
        run_n.text = norm_txt
        run_n.font.color.rgb = COLOR_BODY

    # Right Box: Everyday Citizen & Consumer Pain Points
    right_card = slide2.shapes.add_shape(MSO_SHAPE.RECTANGLE, Inches(6.8), Inches(1.95), Inches(5.7), Inches(5.0))
    right_card.fill.solid()
    right_card.fill.fore_color.rgb = COLOR_PANEL
    right_card.line.color.rgb = COLOR_BORDER

    # Blue top accent strip
    b_strip = slide2.shapes.add_shape(MSO_SHAPE.RECTANGLE, Inches(6.8), Inches(1.95), Inches(5.7), Inches(0.08))
    b_strip.fill.solid()
    b_strip.fill.fore_color.rgb = COLOR_BLUE
    b_strip.line.color.rgb = COLOR_BLUE

    tb_right = slide2.shapes.add_textbox(Inches(7.05), Inches(2.15), Inches(5.2), Inches(4.6))
    tf_r = tb_right.text_frame
    tf_r.word_wrap = True
    
    pr_title = tf_r.paragraphs[0]
    pr_title.text = "2. EVERYDAY CITIZENS & STUDENTS"
    pr_title.font.size = Pt(12)
    pr_title.font.bold = True
    pr_title.font.color.rgb = COLOR_BLUE
    pr_title.font.name = "Arial"

    pr_sub = tf_r.add_paragraph()
    pr_sub.text = "Vulnerable targets of rampant digital deception, financial fraud, and panic lures."
    pr_sub.font.size = Pt(9.5)
    pr_sub.font.color.rgb = COLOR_MUTED
    pr_sub.font.name = "Arial"
    pr_sub.space_after = Pt(12)

    cit_problems = [
        ("Explosion of Social Engineering:", "Rampant surge in 'Digital Arrest' warrants, fake electricity disconnection SMS, and bogus part-time job lures."),
        ("No Instant Verification Tool:", "Common users have zero accessible platforms to check suspicious WhatsApp messages or links before clicking."),
        ("Financial & Identity Loss:", "Victims are manipulated into sharing OTPs or wiring money via UPI due to urgent, threatening narratives."),
        ("Reporting & Recovery Void:", "Citizens do not know where to turn when targeted; official helplines (1930, cybercrime.gov.in) lack immediate integration.")
    ]
    for bold_txt, norm_txt in cit_problems:
        p_item = tf_r.add_paragraph()
        p_item.space_after = Pt(9)
        p_item.font.size = Pt(10.0)
        p_item.font.name = "Arial"
        
        run_b = p_item.add_run()
        run_b.text = "•  " + bold_txt + " "
        run_b.font.bold = True
        run_b.font.color.rgb = COLOR_NAVY
        
        run_n = p_item.add_run()
        run_n.text = norm_txt
        run_n.font.color.rgb = COLOR_BODY

    # =========================================================================
    # SLIDE 3: OUR SOLUTION — A BETTER WAY TO SOLVE IT
    # =========================================================================
    slide3 = prs.slides.add_slide(blank_layout)
    add_header(slide3, "Our Solution: The ShieldOne Dual-Tier Defense Platform", "Architecture & Solution Concept", 3)

    # 3 Solution Pillar Cards
    pillars = [
        {
            "num": "01",
            "title": "Professional SOC Intelligence",
            "sub": "Enterprise Real-Time Operations",
            "color": COLOR_BLUE,
            "bg_color": COLOR_LIGHT_BLUE,
            "items": [
                ("Live WebSocket Streaming:", "Sub-second 2-second event push without browser reloads."),
                ("Interactive Global Attack Map:", "Geographic origin plotting powered by Leaflet."),
                ("Dynamic Risk & Anomaly Gauge:", "Real-time threat score calculating severity distribution."),
                ("Audit & Compliance Tracker:", "Continuous SOC 2, ISO 27001, and GDPR controls.")
            ]
        },
        {
            "num": "02",
            "title": "Contextual AI Threat Explainer",
            "sub": "Gemini 2.5 Flash Triage Engine",
            "color": COLOR_INDIGO,
            "bg_color": COLOR_PANEL_ALT,
            "items": [
                ("1-Click Alert Investigation:", "Translates raw hex/IP logs into human-readable breakdowns."),
                ("Root-Cause Attribution:", "Maps attack patterns directly to MITRE ATT&CK techniques."),
                ("Actionable Playbooks:", "Generates immediate containment and firewall blocking rules."),
                ("Interactive SOC Chatbot:", "Conversational assistant for deep technical queries.")
            ]
        },
        {
            "num": "03",
            "title": "Personal Security Center",
            "sub": "Zero-Cost Citizen Cyber Shield",
            "color": COLOR_GREEN,
            "bg_color": COLOR_LIGHT_GREEN,
            "items": [
                ("Indian Cyber Scam Analyzer:", "Detects Digital Arrest, Electricity fraud, UPI, and KYC lures."),
                ("Malicious URL / Link Scanner:", "Analyzes fraudulent domains and credential-stealing pages."),
                ("Automated Incident Response:", "Generates step-by-step guidance on what to do and document."),
                ("Helpline 1930 Integration:", "Direct access to National Cybercrime Portal & RBI Sachet.")
            ]
        }
    ]

    card_w = Inches(3.7)
    gap = Inches(0.3)
    start_x = Inches(0.8)

    for i, p_info in enumerate(pillars):
        cx = start_x + i * (card_w + gap)
        
        # Outer Card
        p_card = slide3.shapes.add_shape(MSO_SHAPE.RECTANGLE, cx, Inches(1.95), card_w, Inches(5.0))
        p_card.fill.solid()
        p_card.fill.fore_color.rgb = COLOR_PANEL
        p_card.line.color.rgb = COLOR_BORDER

        # Accent top bar
        c_bar = slide3.shapes.add_shape(MSO_SHAPE.RECTANGLE, cx, Inches(1.95), card_w, Inches(0.08))
        c_bar.fill.solid()
        c_bar.fill.fore_color.rgb = p_info["color"]
        c_bar.line.color.rgb = p_info["color"]

        # Card Textbox
        tb_p = slide3.shapes.add_textbox(cx + Inches(0.25), Inches(2.15), card_w - Inches(0.5), Inches(4.6))
        tf_pi = tb_p.text_frame
        tf_pi.word_wrap = True

        p_num = tf_pi.paragraphs[0]
        p_num.text = p_info["num"]
        p_num.font.size = Pt(20)
        p_num.font.bold = True
        p_num.font.color.rgb = p_info["color"]
        p_num.font.name = "Arial"

        p_pt = tf_pi.add_paragraph()
        p_pt.text = p_info["title"]
        p_pt.font.size = Pt(13)
        p_pt.font.bold = True
        p_pt.font.color.rgb = COLOR_NAVY
        p_pt.font.name = "Arial"

        p_ps = tf_pi.add_paragraph()
        p_ps.text = p_info["sub"]
        p_ps.font.size = Pt(9.5)
        p_ps.font.color.rgb = COLOR_MUTED
        p_ps.font.name = "Arial"
        p_ps.space_after = Pt(12)

        for b_txt, n_txt in p_info["items"]:
            pi = tf_pi.add_paragraph()
            pi.space_after = Pt(9)
            pi.font.size = Pt(9.5)
            pi.font.name = "Arial"

            rb = pi.add_run()
            rb.text = "✓  " + b_txt + " "
            rb.font.bold = True
            rb.font.color.rgb = COLOR_NAVY

            rn = pi.add_run()
            rn.text = n_txt
            rn.font.color.rgb = COLOR_BODY

    # =========================================================================
    # SLIDE 4: HOW IT WORKS — PRODUCT DEMO & USER JOURNEY
    # =========================================================================
    slide4 = prs.slides.add_slide(blank_layout)
    add_header(slide4, "How It Works: End-to-End User Journeys & Live Interface", "Operational Walkthrough & Demo", 4)

    # Left: Dual User Journeys (Width: 6.2)
    lj_card = slide4.shapes.add_shape(MSO_SHAPE.RECTANGLE, Inches(0.8), Inches(1.95), Inches(6.0), Inches(5.0))
    lj_card.fill.solid()
    lj_card.fill.fore_color.rgb = COLOR_PANEL
    lj_card.line.color.rgb = COLOR_BORDER

    tb_j = slide4.shapes.add_textbox(Inches(1.05), Inches(2.15), Inches(5.5), Inches(4.6))
    tf_j = tb_j.text_frame
    tf_j.word_wrap = True

    # SOC Analyst Journey
    p_j1_title = tf_j.paragraphs[0]
    p_j1_title.text = "JOURNEY A: ENTERPRISE SOC ANALYST"
    p_j1_title.font.size = Pt(11)
    p_j1_title.font.bold = True
    p_j1_title.font.color.rgb = COLOR_BLUE
    p_j1_title.font.name = "Arial"

    soc_steps = [
        ("1. Automated Ingestion:", "Backend syncs with 5 global threat feeds every 30 mins."),
        ("2. Real-Time Telemetry:", "Events streamed via Socket.io directly to the live dashboard."),
        ("3. Visual Triage:", "Leaflet world map pinpoints attack origins; dynamic gauge flags anomalies."),
        ("4. 1-Click AI Mitigation:", "Analyst requests AI diagnosis -> receives instant mitigation steps.")
    ]
    for b_s, n_s in soc_steps:
        ps = tf_j.add_paragraph()
        ps.space_after = Pt(5)
        ps.font.size = Pt(9.5)
        ps.font.name = "Arial"
        rb = ps.add_run()
        rb.text = "• " + b_s + " "
        rb.font.bold = True
        rb.font.color.rgb = COLOR_NAVY
        rn = ps.add_run()
        rn.text = n_s
        rn.font.color.rgb = COLOR_BODY

    # Divider
    p_div = tf_j.add_paragraph()
    p_div.text = "──────────────────────────────────────────────"
    p_div.font.size = Pt(8)
    p_div.font.color.rgb = COLOR_BORDER
    p_div.space_before = Pt(6)
    p_div.space_after = Pt(6)

    # Citizen Journey
    p_j2_title = tf_j.add_paragraph()
    p_j2_title.text = "JOURNEY B: EVERYDAY CONSUMER / STUDENT"
    p_j2_title.font.size = Pt(11)
    p_j2_title.font.bold = True
    p_j2_title.font.color.rgb = COLOR_GREEN
    p_j2_title.font.name = "Arial"

    cit_steps = [
        ("1. Input Suspicious Text/URL:", "User pastes suspicious WhatsApp SMS, phishing link, or notice."),
        ("2. AI Threat Forensics:", "Gemini 2.5 Flash analyzes threat indicators, urgency lures, and spoofing."),
        ("3. Plain-Language Verdict:", "Clear Risk Level (Safe/Medium/High) with identified red flags."),
        ("4. Immediate Escalation:", "Direct connection to National Cybercrime Helpline 1930 & RBI Sachet.")
    ]
    for b_s, n_s in cit_steps:
        ps = tf_j.add_paragraph()
        ps.space_after = Pt(5)
        ps.font.size = Pt(9.5)
        ps.font.name = "Arial"
        rb = ps.add_run()
        rb.text = "• " + b_s + " "
        rb.font.bold = True
        rb.font.color.rgb = COLOR_NAVY
        rn = ps.add_run()
        rn.text = n_s
        rn.font.color.rgb = COLOR_BODY

    # Right: Live UI Screenshot Card (Width: 5.4)
    rj_card = slide4.shapes.add_shape(MSO_SHAPE.RECTANGLE, Inches(7.1), Inches(1.95), Inches(5.4), Inches(5.0))
    rj_card.fill.solid()
    rj_card.fill.fore_color.rgb = COLOR_PANEL
    rj_card.line.color.rgb = COLOR_BORDER

    # Add Dashboard Preview Image if available
    if os.path.exists(dashboard_img):
        slide4.shapes.add_picture(dashboard_img, Inches(7.25), Inches(2.15), width=Inches(5.1))
        
        # Caption below image
        tb_cap = slide4.shapes.add_textbox(Inches(7.25), Inches(5.8), Inches(5.1), Inches(1.0))
        tf_cap = tb_cap.text_frame
        tf_cap.word_wrap = True
        p_cap = tf_cap.paragraphs[0]
        p_cap.text = "LIVE DASHBOARD TELEMETRY IN ACTION"
        p_cap.font.size = Pt(10)
        p_cap.font.bold = True
        p_cap.font.color.rgb = COLOR_NAVY
        p_cap.font.name = "Arial"

        p_cap_sub = tf_cap.add_paragraph()
        p_cap_sub.text = "Dynamic circular risk gauge (97 Risk Critical), anomaly spike banner, real-time threat distribution chart, and live Leaflet attack map."
        p_cap_sub.font.size = Pt(8.5)
        p_cap_sub.font.color.rgb = COLOR_BODY
        p_cap_sub.font.name = "Arial"
        p_cap_sub.space_before = Pt(3)

    # =========================================================================
    # SLIDE 5: WHAT MAKES IT DIFFERENT? (COMPETITIVE ADVANTAGE)
    # =========================================================================
    slide5 = prs.slides.add_slide(blank_layout)
    add_header(slide5, "What Makes ShieldOne Different? Competitive Differentiators", "Value Proposition & Innovation", 5)

    diff_cards = [
        {
            "icon": "🌐",
            "title": "Dual-Spectrum Accessibility",
            "sub": "Enterprise SOC + Public Citizen Defense",
            "color": COLOR_BLUE,
            "desc": "Traditional SIEM solutions (Splunk, IBM QRadar) cost hundreds of thousands of dollars and serve only corporate SOCs. ShieldOne uniquely bridges enterprise-grade intelligence to citizen cyber defense on one unified platform."
        },
        {
            "icon": "⚡",
            "title": "Zero-Lag WebSocket Streaming",
            "sub": "Push Architecture vs. Polling Delays",
            "color": COLOR_INDIGO,
            "desc": "Legacy monitoring systems poll APIs periodically (every 5-15 mins). ShieldOne pushes live threat telemetry every 2 seconds via Socket.io full-duplex WebSockets, eliminating detection latency."
        },
        {
            "icon": "🧠",
            "title": "Contextual LLM Reasoning",
            "sub": "Gemini 2.5 Flash vs. Rigid Regex Rules",
            "color": COLOR_NAVY,
            "desc": "Traditional scanners match static blacklists that attackers easily bypass. ShieldOne utilizes generative AI to comprehend psychological manipulation, urgency cues, and emerging fraud vectors."
        },
        {
            "icon": "🛡️",
            "title": "Automated Multi-Source Fusion",
            "sub": "5 Global Authoritative Threat Feeds",
            "color": COLOR_GREEN,
            "desc": "ShieldOne fuses Abuse.ch Feodo Tracker, MalwareBazaar, ThreatFox, CISA KEV, and DShield honeypot telemetry into a unified ingestion pipeline with zero manual analyst curation required."
        }
    ]

    for idx, d_info in enumerate(diff_cards):
        col = idx % 2
        row = idx // 2
        
        dx = Inches(0.8) + col * Inches(6.0)
        dy = Inches(1.95) + row * Inches(2.45)
        
        # Outer Card
        d_card = slide5.shapes.add_shape(MSO_SHAPE.RECTANGLE, dx, dy, Inches(5.7), Inches(2.3))
        d_card.fill.solid()
        d_card.fill.fore_color.rgb = COLOR_PANEL
        d_card.line.color.rgb = COLOR_BORDER

        # Left vertical accent bar
        l_bar = slide5.shapes.add_shape(MSO_SHAPE.RECTANGLE, dx, dy, Inches(0.12), Inches(2.3))
        l_bar.fill.solid()
        l_bar.fill.fore_color.rgb = d_info["color"]
        l_bar.line.color.rgb = d_info["color"]

        # Text inside Card
        tb_d = slide5.shapes.add_textbox(dx + Inches(0.35), dy + Inches(0.2), Inches(5.1), Inches(1.9))
        tf_d = tb_d.text_frame
        tf_d.word_wrap = True

        p_dt = tf_d.paragraphs[0]
        p_dt.text = f"{d_info['icon']}  {d_info['title']}"
        p_dt.font.size = Pt(13)
        p_dt.font.bold = True
        p_dt.font.color.rgb = COLOR_NAVY
        p_dt.font.name = "Arial"

        p_ds = tf_d.add_paragraph()
        p_ds.text = d_info["sub"]
        p_ds.font.size = Pt(9.0)
        p_ds.font.bold = True
        p_ds.font.color.rgb = d_info["color"]
        p_ds.font.name = "Arial"
        p_ds.space_after = Pt(6)

        p_dd = tf_d.add_paragraph()
        p_dd.text = d_info["desc"]
        p_dd.font.size = Pt(9.5)
        p_dd.font.color.rgb = COLOR_BODY
        p_dd.font.name = "Arial"

    # =========================================================================
    # SLIDE 6: TECHNOLOGY & AI ARCHITECTURE
    # =========================================================================
    slide6 = prs.slides.add_slide(blank_layout)
    add_header(slide6, "Technology Stack & AI Architecture", "System Design & Tech Implementation", 6)

    # 4 Horizontal Architectural Layers
    layers = [
        {
            "layer": "LAYER 1: USER INTERACTION & VISUALIZATION (FRONTEND)",
            "color": COLOR_BLUE,
            "tech": "React 19 • Vite • Leaflet & React-Leaflet • Recharts • GSAP Animations • Vanilla CSS Tokens",
            "desc": "Responsive single-page web app with real-time UI re-rendering, interactive world map coordinates, dynamic SVG risk meters, and dual personal/professional dashboard routing."
        },
        {
            "layer": "LAYER 2: STREAMING & INGESTION BACKEND (MICROSERVICES)",
            "color": COLOR_INDIGO,
            "tech": "Node.js • Express 5 • Socket.io (WebSockets) • Axios • Rate Limiting • CORS Middleware",
            "desc": "High-throughput server pushing 2-second telemetry broadcasts, running 30-minute cron feed synchronizers, and serving secure RESTful authentication and analysis endpoints."
        },
        {
            "layer": "LAYER 3: AI REASONING & LLM TRIAGE ENGINE",
            "color": COLOR_NAVY,
            "tech": "Google Gemini 2.5 Flash • OpenRouter API • Custom Prompt Engineering • JSON Schema Validation",
            "desc": "Generative AI engine performing 1-click incident explanations, MITRE ATT&CK attribution, actionable remediation playbooks, and localized Indian cyber scam pattern analysis."
        },
        {
            "layer": "LAYER 4: THREAT INTELLIGENCE & PERSISTENCE LAYER",
            "color": COLOR_GREEN,
            "tech": "Abuse.ch (Feodo, MalwareBazaar, ThreatFox) • CISA KEV • SANS DShield • Supabase Auth • Nodemailer",
            "desc": "Authoritative feeds providing active botnet C2 IPs, payload signatures, ransomware indicators, and honeypot records with fallback in-memory stores and OTP email delivery."
        }
    ]

    for idx, lay in enumerate(layers):
        ly = Inches(1.95) + idx * Inches(1.22)
        
        # Layer Card
        l_card = slide6.shapes.add_shape(MSO_SHAPE.RECTANGLE, Inches(0.8), ly, Inches(11.733), Inches(1.12))
        l_card.fill.solid()
        l_card.fill.fore_color.rgb = COLOR_PANEL
        l_card.line.color.rgb = COLOR_BORDER

        # Left color bar
        lc_bar = slide6.shapes.add_shape(MSO_SHAPE.RECTANGLE, Inches(0.8), ly, Inches(0.12), Inches(1.12))
        lc_bar.fill.solid()
        lc_bar.fill.fore_color.rgb = lay["color"]
        lc_bar.line.color.rgb = lay["color"]

        # Text Frame
        tb_l = slide6.shapes.add_textbox(Inches(1.15), ly + Inches(0.08), Inches(11.2), Inches(0.95))
        tf_l = tb_l.text_frame
        tf_l.word_wrap = True

        p_lt = tf_l.paragraphs[0]
        p_lt.text = lay["layer"]
        p_lt.font.size = Pt(10)
        p_lt.font.bold = True
        p_lt.font.color.rgb = lay["color"]
        p_lt.font.name = "Arial"

        p_ltech = tf_l.add_paragraph()
        p_ltech.text = "Stack: " + lay["tech"]
        p_ltech.font.size = Pt(9.5)
        p_ltech.font.bold = True
        p_ltech.font.color.rgb = COLOR_NAVY
        p_ltech.font.name = "Arial"

        p_ldesc = tf_l.add_paragraph()
        p_ldesc.text = lay["desc"]
        p_ldesc.font.size = Pt(8.5)
        p_ldesc.font.color.rgb = COLOR_BODY
        p_ldesc.font.name = "Arial"

    # =========================================================================
    # SLIDE 7: IMPACT, FEASIBILITY & SCALABILITY
    # =========================================================================
    slide7 = prs.slides.add_slide(blank_layout)
    add_header(slide7, "Impact, Feasibility & Scalability", "Real-World Viability & Growth", 7)

    impact_pillars = [
        {
            "title": "QUANTIFIABLE IMPACT",
            "color": COLOR_BLUE,
            "points": [
                ("60%+ Triage Acceleration:", "Reduces Tier-1 analyst mean triage time from 20 mins to under 30 seconds via 1-click AI explanations."),
                ("Proactive Fraud Prevention:", "Empowers everyday consumers to verify scam texts and phishing links BEFORE transferring money or sharing credentials."),
                ("Public Awareness & Redressal:", "Directly bridges users to the National Cybercrime Portal (1930) and RBI Sachet, boosting official reporting rates."),
                ("Continuous Audit Readiness:", "Replaces periodic manual compliance checks with real-time SOC 2 and ISO 27001 posture tracking.")
            ]
        },
        {
            "title": "TECHNICAL FEASIBILITY",
            "color": COLOR_INDIGO,
            "points": [
                ("Working End-to-End Prototype:", "Fully functional system deployed with live WebSocket broadcasting and integrated Gemini 2.5 Flash LLM."),
                ("Zero External Database Dependencies:", "Graceful fallback architecture with in-memory session caching when cloud services are unavailable."),
                ("Resilient Rate-Limiting:", "Intelligent 30-minute ingestion workers prevent external feed rate limits while keeping data fresh."),
                ("Cost-Efficient Model:", "Utilizes open-source threat intelligence feeds and lightweight server-sent WebSocket events.")
            ]
        },
        {
            "title": "HORIZONTAL SCALABILITY",
            "color": COLOR_GREEN,
            "points": [
                ("WebSocket Fan-Out Architecture:", "Node.js + Socket.io can distribute live telemetry to thousands of simultaneous analysts."),
                ("Microservices & Cloud Ready:", "Decoupled ingestion, AI triage, and UI components can be containerized with Docker / Kubernetes."),
                ("Enterprise Multi-Tenancy:", "Extensible RBAC allows multiple organizations to run isolated SOC dashboards on shared infrastructure."),
                ("Browser Extension Roadmap:", "Underlying scam analyzer API ready to power real-time browser phishing interception.")
            ]
        }
    ]

    card_w7 = Inches(3.7)
    gap7 = Inches(0.3)
    start_x7 = Inches(0.8)

    for i, imp in enumerate(impact_pillars):
        cx = start_x7 + i * (card_w7 + gap7)
        
        # Outer Card
        i_card = slide7.shapes.add_shape(MSO_SHAPE.RECTANGLE, cx, Inches(1.95), card_w7, Inches(5.0))
        i_card.fill.solid()
        i_card.fill.fore_color.rgb = COLOR_PANEL
        i_card.line.color.rgb = COLOR_BORDER

        # Top color accent
        i_bar = slide7.shapes.add_shape(MSO_SHAPE.RECTANGLE, cx, Inches(1.95), card_w7, Inches(0.08))
        i_bar.fill.solid()
        i_bar.fill.fore_color.rgb = imp["color"]
        i_bar.line.color.rgb = imp["color"]

        # Content Textbox
        tb_i = slide7.shapes.add_textbox(cx + Inches(0.25), Inches(2.15), card_w7 - Inches(0.5), Inches(4.6))
        tf_i = tb_i.text_frame
        tf_i.word_wrap = True

        p_it = tf_i.paragraphs[0]
        p_it.text = imp["title"]
        p_it.font.size = Pt(12)
        p_it.font.bold = True
        p_it.font.color.rgb = imp["color"]
        p_it.font.name = "Arial"
        p_it.space_after = Pt(14)

        for b_txt, n_txt in imp["points"]:
            pi = tf_i.add_paragraph()
            pi.space_after = Pt(10)
            pi.font.size = Pt(9.5)
            pi.font.name = "Arial"

            rb = pi.add_run()
            rb.text = "•  " + b_txt + " "
            rb.font.bold = True
            rb.font.color.rgb = COLOR_NAVY

            rn = pi.add_run()
            rn.text = n_txt
            rn.font.color.rgb = COLOR_BODY

    # =========================================================================
    # SLIDE 8: EXECUTION ROADMAP & THE TEAM
    # =========================================================================
    slide8 = prs.slides.add_slide(blank_layout)
    add_header(slide8, "Execution Roadmap & The Team", "Future Horizons & Project Ownership", 8)

    # Left: 3-Phase Roadmap (Width: 6.8)
    r_card = slide8.shapes.add_shape(MSO_SHAPE.RECTANGLE, Inches(0.8), Inches(1.95), Inches(6.8), Inches(5.0))
    r_card.fill.solid()
    r_card.fill.fore_color.rgb = COLOR_PANEL
    r_card.line.color.rgb = COLOR_BORDER

    tb_r = slide8.shapes.add_textbox(Inches(1.05), Inches(2.15), Inches(6.3), Inches(4.6))
    tf_r = tb_r.text_frame
    tf_r.word_wrap = True

    p_rt = tf_r.paragraphs[0]
    p_rt.text = "STRATEGIC EXECUTION ROADMAP"
    p_rt.font.size = Pt(12)
    p_rt.font.bold = True
    p_rt.font.color.rgb = COLOR_BLUE
    p_rt.font.name = "Arial"
    p_rt.space_after = Pt(12)

    roadmap_items = [
        ("PHASE 1: FOUNDATION & INTELLIGENCE (COMPLETED)", [
            "Real-time SOC Dashboard with 2-second WebSocket broadcasts.",
            "Live Leaflet global attack map with geographic coordinates.",
            "Integrated 5 threat feeds (Feodo, MalwareBazaar, ThreatFox, CISA, DShield).",
            "Gemini 2.5 Flash Attack Explainer and Personal Scam Analyzer."
        ]),
        ("PHASE 2: ENTERPRISE INTEGRATIONS & ENDPOINTS (Q1-Q2)", [
            "Corporate Syslog / CEF log forwarder agent for internal enterprise SIEM ingestion.",
            "Automated SOAR playbooks for firewall IP blocking and quarantine.",
            "Chrome Browser Extension for real-time URL & phishing scam interception."
        ]),
        ("PHASE 3: COLLABORATIVE DEFENSE & SCALING (Q3-Q4)", [
            "Community Threat Sharing Network using STIX/TAXII open standards.",
            "Crowdsourced fraud reporting database for fast scam pattern neutralization.",
            "Enterprise Multi-Tenant SaaS deployment with customizable compliance frameworks."
        ])
    ]

    for phase_title, bullets in roadmap_items:
        p_pt = tf_r.add_paragraph()
        p_pt.text = phase_title
        p_pt.font.size = Pt(10)
        p_pt.font.bold = True
        p_pt.font.color.rgb = COLOR_NAVY
        p_pt.font.name = "Arial"
        p_pt.space_before = Pt(6)

        for b in bullets:
            p_b = tf_r.add_paragraph()
            p_b.text = "• " + b
            p_b.font.size = Pt(8.8)
            p_b.font.color.rgb = COLOR_BODY
            p_b.font.name = "Arial"

    # Right: Team & Project Ownership Card (Width: 4.6)
    t_card = slide8.shapes.add_shape(MSO_SHAPE.RECTANGLE, Inches(7.9), Inches(1.95), Inches(4.633), Inches(5.0))
    t_card.fill.solid()
    t_card.fill.fore_color.rgb = COLOR_PANEL
    t_card.line.color.rgb = COLOR_BORDER

    # Top accent on team card
    t_bar = slide8.shapes.add_shape(MSO_SHAPE.RECTANGLE, Inches(7.9), Inches(1.95), Inches(4.633), Inches(0.08))
    t_bar.fill.solid()
    t_bar.fill.fore_color.rgb = COLOR_BLUE
    t_bar.line.color.rgb = COLOR_BLUE

    tb_t = slide8.shapes.add_textbox(Inches(8.15), Inches(2.15), Inches(4.133), Inches(4.6))
    tf_t = tb_t.text_frame
    tf_t.word_wrap = True

    p_tt = tf_t.paragraphs[0]
    p_tt.text = "PROJECT OWNERSHIP & CONTACT"
    p_tt.font.size = Pt(12)
    p_tt.font.bold = True
    p_tt.font.color.rgb = COLOR_NAVY
    p_tt.font.name = "Arial"
    p_tt.space_after = Pt(14)

    team_details = [
        ("Lead Developer & Architect:", "Bhargav"),
        ("Student UID:", "24BCS11028"),
        ("Academic Section:", "803A"),
        ("Department / Degree:", "Computer Science & Engineering"),
        ("Primary Email:", "bhargav3509@gmail.com"),
        ("Domain:", "Cybersecurity • Applied AI • Full-Stack Web Systems")
    ]
    for lbl, val in team_details:
        pt = tf_t.add_paragraph()
        pt.space_after = Pt(6)
        pt.font.size = Pt(9.5)
        pt.font.name = "Arial"
        
        rb = pt.add_run()
        rb.text = lbl + "\n"
        rb.font.bold = True
        rb.font.color.rgb = COLOR_MUTED
        rb.font.size = Pt(8.5)

        rv = pt.add_run()
        rv.text = val
        rv.font.bold = True
        rv.font.color.rgb = COLOR_NAVY
        rv.font.size = Pt(10.5)

    # Concluding Quote Card at the bottom of Right Column
    quote_card = slide8.shapes.add_shape(MSO_SHAPE.RECTANGLE, Inches(8.15), Inches(5.6), Inches(4.133), Inches(1.15))
    quote_card.fill.solid()
    quote_card.fill.fore_color.rgb = COLOR_LIGHT_BLUE
    quote_card.line.color.rgb = COLOR_BORDER_BLUE

    tf_q = quote_card.text_frame
    tf_q.word_wrap = True
    p_qt = tf_q.paragraphs[0]
    p_qt.text = "“ShieldOne — From raw threat intelligence to real-time security awareness for everyone.”"
    p_qt.alignment = PP_ALIGN.CENTER
    p_qt.font.size = Pt(10)
    p_qt.font.bold = True
    p_qt.font.color.rgb = COLOR_BLUE
    p_qt.font.name = "Arial"

    # Save presentation
    output_path = r"d:\projects\soc-project\presentation\ShieldOne_Presentation.pptx"
    prs.save(output_path)
    print(f"[SUCCESS] Presentation generated successfully at: {output_path}")

if __name__ == "__main__":
    build_presentation()
