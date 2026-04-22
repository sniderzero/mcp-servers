const {
  Document, Packer, Paragraph, TextRun, Table, TableRow, TableCell,
  HeadingLevel, AlignmentType, BorderStyle, WidthType, ShadingType,
  LevelFormat
} = require("docx");
const fs = require("fs");

const BLUE = "1F5C99";
const LIGHT_BLUE = "D6E4F0";
const WARN_BG = "FFF3CD";
const WARN_BORDER = "FFC107";
const GRAY_TEXT = "555555";

const border = (color = "CCCCCC") => ({ style: BorderStyle.SINGLE, size: 1, color });
const noBorder = () => ({ style: BorderStyle.NONE, size: 0, color: "FFFFFF" });

function h1(text) {
  return new Paragraph({
    heading: HeadingLevel.HEADING_1,
    spacing: { before: 320, after: 160 },
    children: [new TextRun({ text, font: "Calibri", size: 36, bold: true, color: BLUE })]
  });
}

function h2(text) {
  return new Paragraph({
    heading: HeadingLevel.HEADING_2,
    spacing: { before: 280, after: 120 },
    children: [new TextRun({ text, font: "Calibri", size: 28, bold: true, color: BLUE })]
  });
}

function h3(text) {
  return new Paragraph({
    heading: HeadingLevel.HEADING_3,
    spacing: { before: 200, after: 80 },
    children: [new TextRun({ text, font: "Calibri", size: 24, bold: true, color: GRAY_TEXT })]
  });
}

function body(text, opts = {}) {
  return new Paragraph({
    spacing: { before: 80, after: 80 },
    children: [new TextRun({ text, font: "Calibri", size: 22, ...opts })]
  });
}

function numbered(items) {
  return items.map((item, i) =>
    new Paragraph({
      numbering: { reference: "numbers", level: 0 },
      spacing: { before: 60, after: 60 },
      children: typeof item === "string"
        ? [new TextRun({ text: item, font: "Calibri", size: 22 })]
        : item
    })
  );
}

function bold(text) {
  return new TextRun({ text, font: "Calibri", size: 22, bold: true });
}

function regular(text) {
  return new TextRun({ text, font: "Calibri", size: 22 });
}

function divider() {
  return new Paragraph({
    spacing: { before: 160, after: 160 },
    border: { bottom: { style: BorderStyle.SINGLE, size: 4, color: "DDDDDD" } },
    children: []
  });
}

function warningBox(text) {
  return new Table({
    width: { size: 9360, type: WidthType.DXA },
    columnWidths: [9360],
    rows: [
      new TableRow({
        children: [
          new TableCell({
            borders: {
              top: border(WARN_BORDER),
              bottom: border(WARN_BORDER),
              left: { style: BorderStyle.SINGLE, size: 12, color: WARN_BORDER },
              right: border(WARN_BORDER),
            },
            shading: { fill: WARN_BG, type: ShadingType.CLEAR },
            margins: { top: 120, bottom: 120, left: 160, right: 160 },
            width: { size: 9360, type: WidthType.DXA },
            children: [
              new Paragraph({
                children: [
                  new TextRun({ text: "Security note:  ", font: "Calibri", size: 22, bold: true }),
                  new TextRun({ text, font: "Calibri", size: 22 }),
                ]
              })
            ]
          })
        ]
      })
    ]
  });
}

function infoBox(lines) {
  return new Table({
    width: { size: 9360, type: WidthType.DXA },
    columnWidths: [9360],
    rows: [
      new TableRow({
        children: [
          new TableCell({
            borders: {
              top: border("BBBBBB"),
              bottom: border("BBBBBB"),
              left: { style: BorderStyle.SINGLE, size: 16, color: BLUE },
              right: border("BBBBBB"),
            },
            shading: { fill: "F4F8FC", type: ShadingType.CLEAR },
            margins: { top: 120, bottom: 120, left: 160, right: 160 },
            width: { size: 9360, type: WidthType.DXA },
            children: lines.map(l =>
              new Paragraph({
                spacing: { before: 40, after: 40 },
                children: l
              })
            )
          })
        ]
      })
    ]
  });
}

const doc = new Document({
  numbering: {
    config: [
      {
        reference: "numbers",
        levels: [{
          level: 0,
          format: LevelFormat.DECIMAL,
          text: "%1.",
          alignment: AlignmentType.LEFT,
          style: { paragraph: { indent: { left: 720, hanging: 360 } } }
        }]
      }
    ]
  },
  styles: {
    default: {
      document: { run: { font: "Calibri", size: 22 } }
    },
    paragraphStyles: [
      {
        id: "Heading1", name: "Heading 1", basedOn: "Normal", next: "Normal", quickFormat: true,
        run: { size: 36, bold: true, font: "Calibri", color: BLUE },
        paragraph: { spacing: { before: 320, after: 160 }, outlineLevel: 0 }
      },
      {
        id: "Heading2", name: "Heading 2", basedOn: "Normal", next: "Normal", quickFormat: true,
        run: { size: 28, bold: true, font: "Calibri", color: BLUE },
        paragraph: { spacing: { before: 280, after: 120 }, outlineLevel: 1 }
      },
      {
        id: "Heading3", name: "Heading 3", basedOn: "Normal", next: "Normal", quickFormat: true,
        run: { size: 24, bold: true, font: "Calibri", color: GRAY_TEXT },
        paragraph: { spacing: { before: 200, after: 80 }, outlineLevel: 2 }
      }
    ]
  },
  sections: [{
    properties: {
      page: {
        size: { width: 12240, height: 15840 },
        margin: { top: 1440, right: 1440, bottom: 1440, left: 1440 }
      }
    },
    children: [

      // Title
      new Paragraph({
        heading: HeadingLevel.HEADING_1,
        spacing: { before: 0, after: 200 },
        children: [new TextRun({ text: "How to Get Your FreshService API Key", font: "Calibri", size: 40, bold: true, color: BLUE })]
      }),

      // Intro
      body("Your API key lets external tools (like the FreshService Claude connector) authenticate with your FreshService account. This article walks you through finding your key — and what to do if you don't see it."),

      new Paragraph({ children: [] }),

      divider(),

      // Step 1
      h2("Step 1: Find Your API Key"),

      ...numbered([
        [regular("Log in to "), bold("FreshService")],
        [regular("Click your "), bold("profile picture"), regular(" in the top-right corner")],
        [regular("Select "), bold("Profile Settings")],
        [regular("Scroll down past the "), bold("\"Delegate Approvals\""), regular(" section")],
        [regular("Complete the "), bold("CAPTCHA"), regular(" on the right side — your API key will appear once verified")],
        [regular("Copy the key and keep it somewhere safe")],
      ]),

      new Paragraph({ children: [] }),

      warningBox("Treat your API key like a password. Anyone with it can access your FreshService account via the API. Do not share it in email, chat, or documents."),

      new Paragraph({ children: [] }),
      divider(),

      // Not seeing it
      h2("Don't See an API Key Option?"),

      body("API key access must be enabled by a FreshService administrator. There are two common reasons it may be missing:"),

      new Paragraph({ children: [] }),

      h3("Option A — API access is disabled at the account level"),
      body("An admin needs to turn it on:"),
      new Paragraph({ children: [] }),

      ...numbered([
        [regular("Click the "), bold("Admin"), regular(" gear icon in the left sidebar")],
        [regular("Go to "), bold("Account Settings"), regular(" (sometimes listed as "), bold("Global Settings"), regular(")")],
        [regular("Find the "), bold("API Settings"), regular(" or "), bold("API Access"), regular(" section")],
        [regular("Enable "), bold("API key access")],
        [regular("Save the changes")],
      ]),

      new Paragraph({ children: [] }),
      body("Once enabled, go back to your Profile Settings — your API key should now appear."),
      new Paragraph({ children: [] }),

      h3("Option B — Your agent role doesn't have API permission"),
      body("Even if API access is on globally, your individual role may not have permission:"),
      new Paragraph({ children: [] }),

      ...numbered([
        [regular("An admin goes to "), bold("Admin \u2192 Agents")],
        [regular("Opens your agent profile")],
        [regular("Goes to the "), bold("Roles"), regular(" or "), bold("Permissions"), regular(" section")],
        [regular("Ensures "), bold("API access"), regular(" is enabled for your role")],
      ]),

      new Paragraph({ children: [] }),

      infoBox([
        [bold("Tip: "), regular("Ask your FreshService administrator to check both settings if the API key still doesn\u2019t appear after enabling account-level access.")],
      ]),

      new Paragraph({ children: [] }),
      divider(),

      // Still having trouble
      h2("Still Having Trouble?"),
      body("Contact your FreshService administrator, or reach out to FreshService support directly at freshservice.com/support."),

      new Paragraph({ children: [] }),

    ]
  }]
});

Packer.toBuffer(doc).then(buffer => {
  fs.writeFileSync("/Users/msnider/Co-Work/freshservice-mcp/FreshService-API-Key-Setup.docx", buffer);
  console.log("Done: FreshService-API-Key-Setup.docx");
});
