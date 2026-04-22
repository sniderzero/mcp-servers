#!/usr/bin/env python3
"""Generate the Workday MCP Admin Setup Guide as a Word document."""

from docx import Document
from docx.shared import Inches, Pt, RGBColor
from docx.enum.text import WD_ALIGN_PARAGRAPH
from docx.enum.table import WD_TABLE_ALIGNMENT
from docx.enum.style import WD_STYLE_TYPE
import os

doc = Document()

# -- Styles --
style = doc.styles['Normal']
font = style.font
font.name = 'Calibri'
font.size = Pt(11)
style.paragraph_format.space_after = Pt(6)

for level in range(1, 4):
    h = doc.styles[f'Heading {level}']
    h.font.color.rgb = RGBColor(0x1B, 0x3A, 0x5C)

# Helper functions
def add_table(headers, rows, col_widths=None):
    table = doc.add_table(rows=1, cols=len(headers), style='Light Grid Accent 1')
    table.alignment = WD_TABLE_ALIGNMENT.LEFT
    hdr_cells = table.rows[0].cells
    for i, h in enumerate(headers):
        hdr_cells[i].text = h
        for p in hdr_cells[i].paragraphs:
            for r in p.runs:
                r.bold = True
                r.font.size = Pt(10)
    for row_data in rows:
        row_cells = table.add_row().cells
        for i, val in enumerate(row_data):
            row_cells[i].text = str(val)
            for p in row_cells[i].paragraphs:
                for r in p.runs:
                    r.font.size = Pt(10)
    doc.add_paragraph()

def add_note(text, label="NOTE"):
    p = doc.add_paragraph()
    run = p.add_run(f"⚠ {label}: ")
    run.bold = True
    run.font.color.rgb = RGBColor(0xCC, 0x66, 0x00)
    p.add_run(text)

def add_nav(text):
    p = doc.add_paragraph()
    run = p.add_run("Navigation: ")
    run.bold = True
    run.font.color.rgb = RGBColor(0x33, 0x66, 0x99)
    p.add_run(text)

def add_steps(steps):
    for i, step in enumerate(steps, 1):
        p = doc.add_paragraph(style='List Number')
        p.text = step

def add_bullet(text):
    p = doc.add_paragraph(style='List Bullet')
    p.text = text

# ============================================================
# TITLE PAGE
# ============================================================
doc.add_paragraph()
doc.add_paragraph()
title = doc.add_paragraph()
title.alignment = WD_ALIGN_PARAGRAPH.CENTER
run = title.add_run('Workday MCP Server\nAdministrator Setup Guide')
run.font.size = Pt(28)
run.font.color.rgb = RGBColor(0x1B, 0x3A, 0x5C)
run.bold = True

subtitle = doc.add_paragraph()
subtitle.alignment = WD_ALIGN_PARAGRAPH.CENTER
run = subtitle.add_run('OAuth 2.0 API Client Configuration\nfor AI Agent Integration')
run.font.size = Pt(16)
run.font.color.rgb = RGBColor(0x66, 0x66, 0x66)

doc.add_paragraph()
doc.add_paragraph()

meta = doc.add_paragraph()
meta.alignment = WD_ALIGN_PARAGRAPH.CENTER
meta.add_run('Version 1.0 — April 2026\n').font.size = Pt(11)
meta.add_run('Confidential — Internal Use Only').font.size = Pt(11)

doc.add_page_break()

# ============================================================
# TABLE OF CONTENTS (manual)
# ============================================================
doc.add_heading('Table of Contents', level=1)
toc_items = [
    '1. Overview & Purpose',
    '2. Prerequisites',
    '3. Sandbox Setup (Complete Walkthrough)',
    '   3.1 Enable OAuth 2.0 on the Tenant',
    '   3.2 Create Integration System User (ISU)',
    '   3.3 Create Integration System Security Group (ISSG)',
    '   3.4 Configure Domain Security Policies',
    '   3.5 Configure Authentication Policy',
    '   3.6 Register OAuth 2.0 API Client',
    '   3.7 Generate Refresh Token',
    '   3.8 Verify Setup with Postman / curl',
    '4. Production Setup',
    '   4.1 Differences from Sandbox',
    '   4.2 Production Checklist',
    '5. Scope & Domain Reference Tables',
    '6. Endpoint URL Reference',
    '7. Common Pitfalls & Troubleshooting',
    '8. Credential Handoff Checklist',
    '9. Ongoing Maintenance',
]
for item in toc_items:
    p = doc.add_paragraph(item)
    p.paragraph_format.space_after = Pt(2)
    p.paragraph_format.space_before = Pt(0)

doc.add_page_break()

# ============================================================
# 1. OVERVIEW
# ============================================================
doc.add_heading('1. Overview & Purpose', level=1)
doc.add_paragraph(
    'This document provides step-by-step instructions for a Workday administrator to configure '
    'OAuth 2.0 API access for the Workday MCP (Model Context Protocol) server. The MCP server '
    'enables AI agents (such as Claude) to interact with Workday data — creating invoices, '
    'purchase orders, projects, running financial reports, and querying HCM data.'
)
doc.add_paragraph(
    'The integration uses OAuth 2.0 Authorization Code grant to ensure every API call '
    'executes under the authenticated user\'s own Workday security profile. This means the '
    'AI agent can only see and do what the user is already authorized to do in Workday.'
)

doc.add_heading('Modules Covered', level=2)
add_table(
    ['Module', 'Access Type', 'Key Operations'],
    [
        ['Financial Management', 'Read + Write', 'Invoices, journals, GL accounts, payments, financial reports'],
        ['Procurement', 'Read + Write', 'Purchase orders, requisitions, supplier management'],
        ['Projects (Resource Mgmt)', 'Read + Write', 'Project creation, plans, cost tracking, billing'],
        ['HCM', 'Read Only', 'Workers, organizations, positions, compensation'],
        ['Reporting', 'Read Only', 'RaaS reports, WQL queries'],
    ]
)

doc.add_heading('Security Model', level=2)
doc.add_paragraph(
    'Each user authenticates with their own Workday credentials via browser-based OAuth. '
    'The MCP server stores encrypted tokens and makes API calls as that user. Workday\'s '
    'native row-level and domain security enforcement applies to every request. There is no '
    'shared service account that bypasses individual permissions.'
)

doc.add_page_break()

# ============================================================
# 2. PREREQUISITES
# ============================================================
doc.add_heading('2. Prerequisites', level=1)
doc.add_paragraph('Before starting, confirm the following:')
add_steps([
    'You have Workday administrator access (Security Administrator or equivalent) to the target tenant',
    'You can access the Workday search bar and run administrative tasks',
    'You know your tenant name (e.g., "company_impl" for sandbox, "company" for production)',
    'You know your Workday data center hostname (e.g., "wd2-impl-services1.workday.com" for sandbox)',
    'You have a secure credential vault (e.g., Azure Key Vault, 1Password) to store API credentials',
    'You have Postman or curl available for testing the OAuth flow',
])

add_note(
    'Sandbox and production are completely separate Workday tenants. Every step in this guide '
    'must be performed independently on each environment. Credentials, security policies, and '
    'API client registrations do NOT carry over between environments.',
    'IMPORTANT'
)

doc.add_page_break()

# ============================================================
# 3. SANDBOX SETUP
# ============================================================
doc.add_heading('3. Sandbox Setup (Complete Walkthrough)', level=1)
doc.add_paragraph(
    'Complete all steps below in your sandbox/implementation tenant first. After validating '
    'the integration works end-to-end in sandbox, repeat the process for production (see Section 4).'
)

# -- 3.1 Enable OAuth --
doc.add_heading('3.1 Enable OAuth 2.0 on the Tenant', level=2)
doc.add_paragraph('OAuth 2.0 must be enabled at the tenant level before any API client can be registered.')
add_nav('Search for "Edit Tenant Setup - Security" in the Workday search bar.')
add_steps([
    'Open the Edit Tenant Setup - Security task.',
    'Scroll down to the OAuth 2.0 Settings section.',
    'Check the box labeled "OAuth 2.0 Clients Enabled".',
    'Click OK / Save.',
])
add_note('This is a one-time step per tenant. It does not affect existing SSO or human user authentication.')

# -- 3.2 Create ISU --
doc.add_heading('3.2 Create Integration System User (ISU)', level=2)
doc.add_paragraph(
    'An Integration System User is a dedicated non-human account used for API token generation. '
    'While end users will authenticate with their own credentials, the ISU is needed for initial '
    'token setup and as a fallback for service-to-service operations.'
)
add_nav('Search for "Create Integration System User" in the Workday search bar.')
add_steps([
    'Enter a descriptive User Name: ISU_WorkdayMCP_Integration',
    'Set a strong Password (cannot contain &, <, or > due to XML encoding restrictions).',
    'UNCHECK "Require New Password at Next Sign In".',
    'Set Session Timeout Minutes to 0 (zero) — prevents session expiry from breaking token refreshes.',
    'CHECK "Do Not Allow UI Sessions" — prevents the account from logging into the Workday UI.',
    'Click OK / Save.',
    'Record the username and password securely in your credential vault.',
])

doc.add_paragraph()
doc.add_paragraph('Next, exempt the ISU from password expiration:')
add_nav('Search for "Maintain Password Rules" in the Workday search bar.')
add_steps([
    'Add the ISU (ISU_WorkdayMCP_Integration) to the "System Users exempt from password expiration" list.',
    'Save.',
])

add_note(
    'If the ISU password expires, all token refreshes will fail silently. Always add the ISU '
    'to the password expiration exemption list.'
)

# -- 3.3 Create ISSG --
doc.add_heading('3.3 Create Integration System Security Group (ISSG)', level=2)
add_nav('Search for "Create Security Group" in the Workday search bar.')
add_steps([
    'In the "Type of Tenanted Security Group" dropdown, select "Integration System Security Group (Unconstrained)".',
    'Name: ISSG_WorkdayMCP',
    'Click OK.',
    'On the Edit screen, add the ISU (ISU_WorkdayMCP_Integration) to the group.',
    'Save.',
])

# -- 3.4 Domain Security Policies --
doc.add_heading('3.4 Configure Domain Security Policies', level=2)
doc.add_paragraph(
    'Domain security policies control which Workday data the integration can access. Both the '
    'ISSG domain permissions AND the API client scopes must be configured — they are two separate '
    'layers that must align.'
)
add_nav('Search for "Maintain Permissions for Security Group" in the Workday search bar. Select ISSG_WorkdayMCP.')

doc.add_heading('3.4.1 Baseline Domains (Required for All Integrations)', level=3)
add_table(
    ['Domain', 'Access Level'],
    [
        ['Integration', 'Get and Put'],
        ['System', 'Get'],
        ['Workday Query Language', 'Modify'],
    ]
)

doc.add_heading('3.4.2 Financial Management Domains', level=3)
add_table(
    ['Domain', 'Access Level', 'Purpose'],
    [
        ['Financial Management', 'Get and Put', 'Invoices, journals, GL accounts, financial reports'],
        ['Banking and Settlement', 'Get', 'Payment processing data'],
        ['Business Assets', 'Get', 'Asset tracking and reporting'],
        ['Accounting', 'Get and Put', 'Accounting entries, journal creation'],
        ['Revenue Management', 'Get', 'Revenue recognition and billing data'],
    ]
)

doc.add_heading('3.4.3 Procurement Domains', level=3)
add_table(
    ['Domain', 'Access Level', 'Purpose'],
    [
        ['Procurement', 'Get and Put', 'Purchase orders, requisitions'],
        ['Supplier Accounts', 'Get and Put', 'Supplier/vendor management'],
        ['Purchase Orders', 'Get and Put', 'PO creation and tracking'],
        ['Expenses', 'Get', 'Expense reporting data'],
    ]
)

doc.add_heading('3.4.4 Projects / Resource Management Domains', level=3)
add_table(
    ['Domain', 'Access Level', 'Purpose'],
    [
        ['Resource Management', 'Get and Put', 'Project creation, management'],
        ['Projects and Work', 'Get and Put', 'Project plans, task tracking'],
        ['Project Billing', 'Get', 'Project cost tracking and billing'],
    ]
)

doc.add_heading('3.4.5 HCM Domains', level=3)
add_table(
    ['Domain', 'Access Level', 'Purpose'],
    [
        ['Worker Data: Current Staffing Information', 'Get', 'Current worker records'],
        ['Worker Data: Public Worker Reports', 'Get', 'Worker directory data'],
        ['Organizations and Roles', 'Get', 'Org structure, supervisory orgs'],
        ['Staffing', 'Get', 'Positions, job profiles'],
        ['Person Data: Work Contact Information', 'Get', 'Work email, phone'],
    ]
)

doc.add_paragraph()
p = doc.add_paragraph()
run = p.add_run('⚠ CRITICAL: Activate the security policy changes!')
run.bold = True
run.font.color.rgb = RGBColor(0xCC, 0x00, 0x00)

add_nav('Search for "Activate Pending Security Policy Changes" in the Workday search bar.')
add_steps([
    'Enter a descriptive comment: "Enabling domain access for WorkdayMCP integration".',
    'Click OK to activate.',
    'Verify the confirmation message shows all changes were applied.',
])

add_note(
    'Until you activate, permissions are staged but NOT enforced. This is the #1 cause of 401/403 errors. '
    'You must activate after EVERY batch of domain permission changes.',
    'CRITICAL'
)

# -- 3.5 Authentication Policy --
doc.add_heading('3.5 Configure Authentication Policy', level=2)
doc.add_paragraph(
    'If your tenant requires SAML authentication by default, the ISU will be unable to '
    'authenticate for token generation. You must create an exception.'
)
add_nav('Search for "Manage Authentication Policies" in the Workday search bar.')
add_steps([
    'Open or create an authentication policy.',
    'Add an Authentication Allowlist Rule for your ISSG (ISSG_WorkdayMCP).',
    'Set Allowed Authentication Types to include "User Name Password".',
    'Save.',
    'Search for "Activate All Pending Authentication Policy Changes" and confirm.',
])

# -- 3.6 Register API Client --
doc.add_heading('3.6 Register OAuth 2.0 API Client', level=2)
add_nav('Search for "Register API Client for Integrations" in the Workday search bar.')
doc.add_paragraph('Fill in all fields exactly as shown:')

add_table(
    ['Field', 'Value'],
    [
        ['Client Name', 'WorkdayMCP_OAuth_Client'],
        ['Client Grant Type', 'Authorization Code Grant'],
        ['Access Token Type', 'Bearer'],
        ['Enable PKCE', 'Checked (recommended)'],
        ['Access Token Expiration', '60 minutes (maximum allowed)'],
        ['Non-Expiring Refresh Tokens', 'Checked (recommended for server integrations)'],
        ['Redirect URI #1 (local dev)', 'http://localhost:8080/callback'],
        ['Redirect URI #2 (Postman)', 'https://oauth.pstmn.io/v1/callback'],
        ['Redirect URI #3 (shared svc)', 'https://<your-service-url>/auth/callback (add later)'],
    ]
)

doc.add_heading('Required Functional Area Scopes', level=3)
doc.add_paragraph('Select ALL of the following scopes in the registration form:')

add_table(
    ['Scope (Functional Area)', 'Required For'],
    [
        ['Integration', 'ALL integrations (mandatory baseline)'],
        ['System', 'ALL integrations (mandatory baseline)'],
        ['Tenant Non-configurable', 'ALL integrations (mandatory baseline)'],
        ['Financial Management', 'Invoices, journals, GL accounts, payments'],
        ['Procurement', 'Purchase orders, requisitions'],
        ['Supplier Accounts', 'Supplier/vendor management'],
        ['Resource Management', 'Projects, project plans, cost tracking'],
        ['Staffing', 'Worker data, positions'],
        ['Human Capital Management', 'Worker data, compensation'],
        ['Organizations and Roles', 'Organizational structure'],
    ]
)

doc.add_paragraph()
p = doc.add_paragraph()
run = p.add_run('Click OK. Workday will display the Client ID and Client Secret.')
run.bold = True

add_note(
    'The Client Secret is shown ONLY ONCE at creation. Copy both the Client ID and Client Secret '
    'immediately and store them in your credential vault. If the secret is lost, you must regenerate '
    'it, which invalidates all existing tokens.',
    'CRITICAL'
)

doc.add_paragraph()
doc.add_paragraph('Record these values:')
add_table(
    ['Credential', 'Value', 'Where to Store'],
    [
        ['Client ID', '(copy from Workday)', 'Credential vault → WORKDAY_CLIENT_ID'],
        ['Client Secret', '(copy from Workday — shown once!)', 'Credential vault → WORKDAY_CLIENT_SECRET'],
        ['Tenant URL', 'https://wd2-impl-services1.workday.com', 'Credential vault → WORKDAY_TENANT_URL'],
        ['Tenant Name', '<your_company>_impl', 'Used in endpoint URLs'],
    ]
)

# -- 3.7 Generate Refresh Token --
doc.add_heading('3.7 Generate Refresh Token', level=2)
add_nav('Search for "View API Clients" in the Workday search bar.')
add_steps([
    'Go to the API Clients for Integrations tab.',
    'Find WorkdayMCP_OAuth_Client.',
    'Click the ellipsis (…) menu → API Client → Manage Refresh Tokens for Integrations.',
    'Select the ISU: ISU_WorkdayMCP_Integration.',
    'Check "Generate New Refresh Token".',
    'Click OK.',
    'Copy the refresh token immediately and store it in your credential vault.',
])

add_note('The refresh token is also shown only once. Store it securely alongside the Client ID and Secret.')

# -- 3.8 Verify Setup --
doc.add_heading('3.8 Verify Setup with Postman / curl', level=2)

doc.add_heading('Option A: curl (Refresh Token Grant)', level=3)
doc.add_paragraph('Run this command to exchange the refresh token for an access token:')

code = doc.add_paragraph()
code.paragraph_format.space_before = Pt(6)
code.paragraph_format.space_after = Pt(6)
run = code.add_run(
    'curl -X POST \\\n'
    '  "https://wd2-impl-services1.workday.com/ccx/oauth2/<TENANT>/token" \\\n'
    '  -H "Content-Type: application/x-www-form-urlencoded" \\\n'
    '  -d "grant_type=refresh_token" \\\n'
    '  -d "refresh_token=<REFRESH_TOKEN>" \\\n'
    '  -d "client_id=<CLIENT_ID>" \\\n'
    '  -d "client_secret=<CLIENT_SECRET>"'
)
run.font.name = 'Consolas'
run.font.size = Pt(9)

doc.add_paragraph('Expected response:')
code2 = doc.add_paragraph()
run2 = code2.add_run(
    '{\n'
    '  "access_token": "eyJ...",\n'
    '  "token_type": "Bearer",\n'
    '  "expires_in": 3600,\n'
    '  "refresh_token": "<refresh_token>"\n'
    '}'
)
run2.font.name = 'Consolas'
run2.font.size = Pt(9)

doc.add_paragraph('Then test a financial API call:')
code3 = doc.add_paragraph()
run3 = code3.add_run(
    'curl -X GET \\\n'
    '  "https://wd2-impl-services1.workday.com/ccx/api/financialManagement/v1/<TENANT>/businessUnits" \\\n'
    '  -H "Authorization: Bearer <ACCESS_TOKEN>"'
)
run3.font.name = 'Consolas'
run3.font.size = Pt(9)

doc.add_paragraph()
doc.add_paragraph('If you get a 200 response with business unit data, the setup is complete.')

doc.add_heading('Option B: Postman (Authorization Code Grant)', level=3)
add_steps([
    'Create a new request in Postman. Open the Authorization tab.',
    'Select OAuth 2.0 as the type.',
    'Click "Get New Access Token" and fill in:\n'
    '    • Grant Type: Authorization Code\n'
    '    • Auth URL: https://wd2-impl-services1.workday.com/ccx/oauth2/<TENANT>/authorize\n'
    '    • Token URL: https://wd2-impl-services1.workday.com/ccx/oauth2/<TENANT>/token\n'
    '    • Client ID: <your_client_id>\n'
    '    • Client Secret: <your_client_secret>\n'
    '    • Redirect URI: https://oauth.pstmn.io/v1/callback\n'
    '    • Scope: (leave blank — scopes are set at client registration)',
    'Click "Request Token" — Workday redirects to a login page.',
    'Authenticate as the ISU or a test user.',
    'Postman receives the token. Use it as a Bearer token on subsequent requests.',
])

doc.add_page_break()

# ============================================================
# 4. PRODUCTION SETUP
# ============================================================
doc.add_heading('4. Production Setup', level=1)

doc.add_heading('4.1 Differences from Sandbox', level=2)
add_table(
    ['Aspect', 'Sandbox', 'Production'],
    [
        ['URL Hostname', 'wd2-impl-services1.workday.com', '<your-dc>.workday.com (e.g., wd3.myworkday.com)'],
        ['Tenant Name', '<company>_impl or <company>_preview', '<company> (no suffix)'],
        ['Credentials', 'Separate ISU, Client ID/Secret, Refresh Token', 'Completely separate set — NEVER reuse sandbox creds'],
        ['OAuth 2.0 Toggle', 'Must be enabled independently', 'Must be enabled independently'],
        ['Domain Policies', 'Configured independently', 'Does NOT inherit from sandbox'],
        ['Weekly Refresh', 'Sandbox may be refreshed from prod (resets creds)', 'Stable'],
        ['Redirect URIs', 'http://localhost:8080/callback', 'https://<production-service-url>/auth/callback'],
    ]
)

doc.add_heading('4.2 Production Checklist', level=2)
doc.add_paragraph('Repeat every step from Section 3, with these production-specific adjustments:')
add_steps([
    'Enable OAuth 2.0 on the production tenant (Section 3.1).',
    'Create a PRODUCTION ISU: ISU_WorkdayMCP_Prod (Section 3.2).',
    'Create a PRODUCTION ISSG: ISSG_WorkdayMCP_Prod (Section 3.3).',
    'Configure identical domain security policies (Section 3.4) — or restrict further for production.',
    'ACTIVATE pending security policy changes (do not forget this step).',
    'Configure authentication policy exception for the production ISSG (Section 3.5).',
    'Register a NEW API client: WorkdayMCP_OAuth_Client_Prod (Section 3.6).\n'
    '    • Update Redirect URI to production service URL: https://<service-url>/auth/callback\n'
    '    • Keep http://localhost:8080/callback for admin testing',
    'Generate refresh token for the production ISU (Section 3.7).',
    'Test with curl against the production endpoints (Section 3.8).',
    'Store all production credentials in a SEPARATE vault entry from sandbox.',
])

add_note(
    'Your production data center hostname can be found at resourcecenter.workday.com under the Data Centers page. '
    'Common formats: wd3.myworkday.com, wd5.myworkday.com, etc.',
    'TIP'
)

doc.add_page_break()

# ============================================================
# 5. SCOPE & DOMAIN REFERENCE
# ============================================================
doc.add_heading('5. Scope & Domain Reference Tables', level=1)
doc.add_paragraph('This section maps business requirements to both API client scopes and ISSG domain permissions. Both layers must be configured.')

add_table(
    ['Business Requirement', 'API Client Scope(s)', 'ISSG Domain(s)'],
    [
        ['All integrations (baseline)', 'Integration, System, Tenant Non-configurable', 'Integration (Get/Put), System (Get), WQL (Modify)'],
        ['Invoices, Journals, GL', 'Financial Management', 'Financial Management, Accounting, Banking and Settlement'],
        ['Purchase Orders, Requisitions', 'Procurement, Supplier Accounts', 'Procurement, Purchase Orders, Supplier Accounts'],
        ['Projects, Cost Tracking', 'Resource Management', 'Resource Management, Projects and Work, Project Billing'],
        ['Worker Data', 'Staffing, HCM, Organizations and Roles', 'Worker Data (Current/Public), Staffing, Organizations and Roles'],
        ['Financial Reports (RaaS)', 'Financial Management', 'Financial Management (Get)'],
        ['Ad-hoc Queries (WQL)', 'System', 'Workday Query Language (Modify)'],
    ]
)

doc.add_page_break()

# ============================================================
# 6. ENDPOINT URL REFERENCE
# ============================================================
doc.add_heading('6. Endpoint URL Reference', level=1)

doc.add_heading('Sandbox / Implementation', level=2)
add_table(
    ['Endpoint', 'URL Pattern'],
    [
        ['Authorization', 'https://wd2-impl-services1.workday.com/ccx/oauth2/<TENANT>/authorize'],
        ['Token', 'https://wd2-impl-services1.workday.com/ccx/oauth2/<TENANT>/token'],
        ['Financial Mgmt REST', 'https://wd2-impl-services1.workday.com/ccx/api/financialManagement/v1/<TENANT>/'],
        ['Resource Mgmt REST', 'https://wd2-impl-services1.workday.com/ccx/api/resourceManagement/v1/<TENANT>/'],
        ['Staffing REST', 'https://wd2-impl-services1.workday.com/ccx/api/staffing/v1/<TENANT>/'],
        ['WQL', 'https://wd2-impl-services1.workday.com/ccx/api/wql/v1/<TENANT>/data'],
        ['Financial Mgmt SOAP', 'https://wd2-impl-services1.workday.com/ccx/service/<TENANT>/Financial_Management/v44.2'],
        ['Resource Mgmt SOAP', 'https://wd2-impl-services1.workday.com/ccx/service/<TENANT>/Resource_Management/v42.1'],
    ]
)

doc.add_heading('Production', level=2)
add_table(
    ['Endpoint', 'URL Pattern'],
    [
        ['Authorization', 'https://<DC>.workday.com/ccx/oauth2/<TENANT>/authorize'],
        ['Token', 'https://<DC>.workday.com/ccx/oauth2/<TENANT>/token'],
        ['Financial Mgmt REST', 'https://<DC>.workday.com/ccx/api/financialManagement/v1/<TENANT>/'],
        ['Resource Mgmt REST', 'https://<DC>.workday.com/ccx/api/resourceManagement/v1/<TENANT>/'],
        ['Staffing REST', 'https://<DC>.workday.com/ccx/api/staffing/v1/<TENANT>/'],
        ['WQL', 'https://<DC>.workday.com/ccx/api/wql/v1/<TENANT>/data'],
        ['Financial Mgmt SOAP', 'https://<DC>.workday.com/ccx/service/<TENANT>/Financial_Management/v44.2'],
        ['Resource Mgmt SOAP', 'https://<DC>.workday.com/ccx/service/<TENANT>/Resource_Management/v42.1'],
    ]
)
doc.add_paragraph('Replace <DC> with your data center hostname (e.g., wd3.myworkday.com) and <TENANT> with your tenant name.')

doc.add_page_break()

# ============================================================
# 7. COMMON PITFALLS
# ============================================================
doc.add_heading('7. Common Pitfalls & Troubleshooting', level=1)

pitfalls = [
    ('401/403 after setup',
     'Domain security policy changes were not activated. Run "Activate Pending Security Policy Changes" '
     'after every batch of permission changes. This is the #1 cause of auth failures.'),
    ('Token refresh fails silently',
     'ISU session timeout is not set to 0, or ISU password has expired. Verify both settings.'),
    ('SAML authentication error on token request',
     'The tenant\'s default authentication policy requires SAML. Create an exception rule for the ISSG '
     'that allows "User Name Password" authentication.'),
    ('Redirect URI mismatch error',
     'The redirect URI in the authorization request must EXACTLY match what was registered — including '
     'protocol (http vs https), port, path, and trailing slash. Even one character difference fails.'),
    ('Client Secret lost',
     'Workday shows the secret only once at creation. If lost, regenerate it via the API client settings. '
     'This invalidates all existing tokens using the old secret.'),
    ('Scope/domain mismatch (200 response but empty data)',
     'API client has the scope, but the ISSG is missing the domain permission (or vice versa). Both layers '
     'must be configured. Check the scope-domain mapping table in Section 5.'),
    ('Sandbox credentials stop working after weekend',
     'Sandbox tenants are periodically refreshed from production, which can reset ISU passwords, API client '
     'secrets, and refresh tokens. Re-run the full setup after any sandbox refresh.'),
    ('Using generic /v1/ endpoint path',
     'Use the service-specific path: /ccx/api/<serviceName>/v1/<tenant>/ (e.g., /ccx/api/financialManagement/v1/<tenant>/). '
     'The generic /ccx/api/v1/<tenant>/ path is unreliable.'),
    ('Rate limiting (429 errors)',
     'Workday enforces approximately 10 concurrent requests per integration. The MCP server has built-in '
     'rate limiting, but if other integrations share the same ISU, they compete for capacity.'),
    ('Permission changes not visible to user',
     'Remember: this integration uses per-user OAuth. The ISU domain permissions define the ceiling, but each '
     'user still sees only what their own Workday security profile allows.'),
]

for title, desc in pitfalls:
    p = doc.add_paragraph()
    run = p.add_run(f'{title}: ')
    run.bold = True
    p.add_run(desc)
    p.paragraph_format.space_after = Pt(8)

doc.add_page_break()

# ============================================================
# 8. CREDENTIAL HANDOFF
# ============================================================
doc.add_heading('8. Credential Handoff Checklist', level=1)
doc.add_paragraph(
    'After completing setup, provide the following values to the MCP server administrator. '
    'These map directly to environment variables in the .env configuration file.'
)

add_table(
    ['Environment Variable', 'Description', 'Example Value'],
    [
        ['WORKDAY_CLIENT_ID', 'OAuth Client ID from Step 3.6', 'YTM0NjQxYjMtOTk...'],
        ['WORKDAY_CLIENT_SECRET', 'OAuth Client Secret from Step 3.6', 'M2E3ZDY1MjktZGI...'],
        ['WORKDAY_TENANT_URL', 'Base URL for the Workday tenant', 'https://wd2-impl-services1.workday.com'],
        ['WORKDAY_API_VERSION', 'SOAP API version (default v44.2)', 'v44.2'],
        ['WORKDAY_OAUTH_PORT', 'Local OAuth callback port (default 8080)', '8080'],
        ['Tenant Name', 'Workday tenant identifier', 'company_impl (sandbox)'],
        ['Refresh Token', 'From Step 3.7 (for initial testing)', '<stored in vault>'],
    ]
)

doc.add_paragraph()
doc.add_paragraph('Delivery method: Share via your organization\'s secure credential vault (e.g., Azure Key Vault, 1Password). Never share credentials via email, Slack, or other unencrypted channels.')

doc.add_page_break()

# ============================================================
# 9. ONGOING MAINTENANCE
# ============================================================
doc.add_heading('9. Ongoing Maintenance', level=1)

doc.add_heading('Bi-Annual Workday Releases', level=2)
doc.add_paragraph(
    'Workday releases major platform updates twice per year (typically March and September). '
    'After each release:'
)
add_steps([
    'Verify the SOAP API versions (v44.2, v42.1) are still supported. Check the Workday Community API directory.',
    'Run integration tests against sandbox after the release is applied.',
    'If API versions are deprecated, update the WORKDAY_API_VERSION configuration and notify the MCP team.',
])

doc.add_heading('Sandbox Refreshes', level=2)
doc.add_paragraph(
    'When sandbox is refreshed from production, all credentials may be reset. After a refresh:'
)
add_steps([
    'Verify the ISU still exists and the password works.',
    'Verify the API client registration still exists.',
    'If reset, re-run the full sandbox setup (Sections 3.1–3.8).',
    'Generate a new refresh token if the previous one was invalidated.',
])

doc.add_heading('Adding New Redirect URIs', level=2)
doc.add_paragraph(
    'When the MCP server is deployed to a new environment (e.g., staging, production service), '
    'add the new callback URL as a redirect URI:'
)
add_nav('Search for "View API Clients" → find WorkdayMCP_OAuth_Client → Edit → add Redirect URI.')

doc.add_heading('Revoking Access', level=2)
doc.add_paragraph('To disable the integration:')
add_steps([
    'Search for "View API Clients" → find WorkdayMCP_OAuth_Client → Disable or Delete.',
    'Revoke all refresh tokens via "Manage Refresh Tokens for Integrations".',
    'Optionally: deactivate the ISU and remove domain permissions from the ISSG.',
])

# ============================================================
# SAVE
# ============================================================
output_path = '/Users/msnider/Co-Work/workday-mcp/docs/Workday_MCP_Admin_Setup_Guide.docx'
os.makedirs(os.path.dirname(output_path), exist_ok=True)
doc.save(output_path)
print(f'Document saved to: {output_path}')
