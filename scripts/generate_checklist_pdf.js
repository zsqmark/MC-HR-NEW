import fs from 'fs';
import path from 'path';
import { jsPDF } from 'jspdf';

const fontB64 = fs.readFileSync('/tmp/wqy.ttf').toString('base64');

// A4 Landscape: 297mm x 210mm
const doc = new jsPDF({
  orientation: 'landscape',
  unit: 'mm',
  format: 'a4',
});

doc.addFileToVFS('wqy.ttf', fontB64);
doc.addFont('wqy.ttf', 'wqy', 'normal');
doc.setFont('wqy');

const pageWidth = 297;
const pageHeight = 210;
const marginX = 18;
const marginY = 14;
const contentWidth = pageWidth - marginX * 2; // 261mm

const colSigWidth = 24;
const colObsWidth = contentWidth - colSigWidth; // 237mm
const sigX = marginX + colObsWidth;

function drawHeader(isPage1 = true) {
  // Flame/swirl logo placeholder and text: MALAYA CORNER 旺角
  // Draw flame icon
  const logoX = marginX;
  const logoY = marginY;
  
  // Malaya Corner text
  doc.setFontSize(14);
  doc.setTextColor(55, 65, 81); // slate-700
  doc.text('MALAYA CORNER', logoX + 6, logoY + 4);
  doc.setTextColor(100, 116, 139);
  doc.text('旺角', logoX + 54, logoY + 4);

  // Little flame badge
  doc.setFillColor(249, 115, 22); // orange-500
  doc.circle(logoX + 2, logoY + 2.5, 2.5, 'F');
  doc.setFillColor(239, 68, 68); // red-500
  doc.circle(logoX + 1.8, logoY + 3.2, 1.6, 'F');

  if (isPage1) {
    // Title
    doc.setFontSize(13);
    doc.setTextColor(229, 142, 0); // warm gold/orange #e58e00
    doc.text('Food handler skills and knowledge checklist 食品加工人员技能和知识清单', marginX, marginY + 11);

    // Intro paragraph
    doc.setFontSize(7.5);
    doc.setTextColor(51, 51, 51);
    const introText = 'As a food handler, you have certain legal obligations to help protect both your customers and you from potential food borne illness. Please complete this checklist after completing your food safety training. If you have any questions, ask your supervisor for advice. Place your initials in each box once you have understood each section. It is important that you understand these obligations, so please ask for clarification from your supervisor if you require assistance. 作为食品加工人员，您有一定的法律义务来帮助保护您的客户和您免受潜在的食源性疾病的侵害。 请在完成食品安全培训后填写此清单。 如果您有任何问题，请向您的主管寻求建议。一旦您理解了每个部分，请将您的姓名首字母放在每个框中。 了解这些义务很重要，因此如果您需要帮助，请向您的主管寻求说明。';
    const splitIntro = doc.splitTextToSize(introText, contentWidth);
    doc.text(splitIntro, marginX, marginY + 16.5);
  }
}

// Table drawer
function drawTableHeader(startY) {
  // Amber banner
  doc.setFillColor(229, 142, 0);
  doc.rect(marginX, startY, colObsWidth, 7, 'F');
  doc.rect(sigX, startY, colSigWidth, 7, 'F');
  doc.setDrawColor(200, 200, 200);
  doc.rect(marginX, startY, contentWidth, 7, 'S');
  doc.line(sigX, startY, sigX, startY + 7);

  doc.setFontSize(8.5);
  doc.setTextColor(255, 255, 255);
  doc.text('Obligations', marginX + 3, startY + 4.8);
  doc.text('Signature', sigX + 4.5, startY + 4.8);

  return startY + 7;
}

function drawRow(startY, textLines) {
  doc.setFontSize(7.3);
  doc.setTextColor(30, 41, 59);

  let formattedLines = [];
  for (const item of textLines) {
    if (typeof item === 'string') {
      const split = doc.splitTextToSize(item, colObsWidth - 8);
      formattedLines.push(...split);
    } else if (item.bullet) {
      const bulletText = `•  ${item.bullet}`;
      const split = doc.splitTextToSize(bulletText, colObsWidth - 12);
      formattedLines.push(...split);
    }
  }

  const lineHeight = 3.6;
  const paddingY = 4;
  const rowHeight = Math.max(16, formattedLines.length * lineHeight + paddingY * 2);

  // Border
  doc.setDrawColor(180, 180, 180);
  doc.setLineWidth(0.2);
  doc.rect(marginX, startY, contentWidth, rowHeight, 'S');
  doc.line(sigX, startY, sigX, startY + rowHeight);

  // Text
  let currentY = startY + paddingY + 2.5;
  for (const line of formattedLines) {
    doc.text(line, marginX + 4, currentY);
    currentY += lineHeight;
  }

  return startY + rowHeight;
}

// ===== PAGE 1 =====
drawHeader(true);
let y = drawTableHeader(32);

// Row 1
y = drawRow(y, [
  'As a food handler, I must take all reasonable measures not to handle food or surfaces likely to come into contact with food in a way that is likely to compromise the safety and suitability of food. 作为一名食品处理人员，我必须采取一切合理措施，避免以可能损害食品安全性和适用性的方式处理食品或可能与食品接触的表面。'
]);

// Row 2
y = drawRow(y, [
  'As a food handler, if I have a condition or a symptom that indicates that I may be suffering from a food borne disease, or if I know I am suffering from a food borne disease, or that I am a carrier of a food borne disease, whilst at work I must: 作为一名食品处理人员，如果我有某种状况或症状表明我可能患有食源性疾病，或者如果我知道自己患有食源性疾病，或者我是食源性疾病的携带者 ，在工作时我必须：',
  { bullet: 'report this to my supervisor; 将此情况报告给我的主管' },
  { bullet: 'not engage in any handling of food where there is a likelihood that I might contaminate food as a result of the disease or condition; and 在我可能在疾病或状况而污染食物的情况下，不从事任何食物处理； 和' },
  { bullet: 'take all practicable measures to prevent food from being contaminated as a result of the disease or condition if my supervisor allows me to do other work on the food premises. 如果我的主管允许我在食肆从事其他工作，请采取一切切实可行的措施来防止食物因疾病或状况而受到污染。' }
]);

// Row 3
y = drawRow(y, [
  'As a food handler, I must notify my supervisor if I know or suspect that I may have contaminated any food that I have handled. 作为一名食品处理人员，如果我知道或怀疑我可能污染了我处理过的任何食品，我必须通知我的主管。'
]);

// ===== PAGE 2 =====
doc.addPage('a4', 'landscape');
drawHeader(false);
y = marginY + 8;

// Row 4
y = drawRow(y, [
  'As a food handler, when engaging in any food handling operation, I must: 作为一名食品处理人员，在从事任何食品处理操作时，我必须：',
  { bullet: 'take all practicable measures to ensure my body, anything from my body, and anything I am wearing does not contaminate food or surfaces likely to come into contact with food; 采取一切切实可行的措施，确保我的身体、我身上的任何东西以及我所穿的任何东西都不会污染食物或可能与食物接触的表面' },
  { bullet: 'take all practicable measures to prevent unnecessary contact with ready-to-eat food; 采取一切切实可行的措施防止不必要地接触即食食品' },
  { bullet: 'ensure my outer clothing is of a level of cleanliness that is appropriate for the handling of food that I am involved with; 确保我的外衣达到适合处理我所涉及的食物的清洁度' },
  { bullet: 'cover any exposed bandages and dressings with highly visible waterproof coverings; 用高度可见的防水覆盖物覆盖任何暴露的绷带和敷料' },
  { bullet: 'not eat over unprotected food or surfaces likely to come into contact with food; 不要在未受保护的食物或可能与食物接触的表面上进食；' },
  { bullet: 'not sneeze, blow or cough over unprotected food or surfaces likely to come into contact with food; 不要在未受保护的食物或可能与食物接触的表面上打喷嚏、吹气或咳嗽' },
  { bullet: 'not spit, smoke or use tobacco or similar preparations in areas in which food is handled; and 不得在处理食品的区域吐痰、吸烟或使用烟草或类似制品； 和' },
  { bullet: 'always use the designated toilet facilities. 始终使用指定的厕所设施。' }
]);

// Row 5
y = drawRow(y, [
  'As a food handler, I must wash my hands: 作为食品加工人员，我必须洗手：',
  { bullet: 'whenever they are likely to be a source of contamination of food; 每当它们可能成为食品污染源时；' },
  { bullet: 'immediately before working with ready-to-eat food or after handling raw food; 在处理即食食品之前或处理生食之后；' },
  { bullet: 'immediately after using the toilet; 上完厕所后立即；' },
  { bullet: 'before commencing or re-commencing handling food; 在开始或重新开始处理食物之前；' },
  { bullet: 'immediately after smoking, coughing, sneezing, using a handkerchief or disposable tissue, eating, drinking or using tobacco or similar substances; and 吸烟、咳嗽、打喷嚏、使用手帕或一次性纸巾、进食、饮水或使用烟草或类似物质后立即； 和' },
  { bullet: 'after touching my hair, scalp or a body opening. 触摸我的头发、头皮或身体开口后。' }
]);

// Row 6
y = drawRow(y, [
  'As a food handler, I must wash my hands in the manner described below, when engaging in a food handling operation that involves unprotected food or surfaces likely to come into contact with food: 作为一名食品处理人员，在从事涉及未受保护的食品或可能与食品接触的表面的食品处理操作时，我必须以下述方式洗手：',
  { bullet: 'with warm running water; and 用温水； 和' },
  { bullet: 'using soap 使用肥皂' }
]);

// Page 2 Footer
doc.setFontSize(8);
doc.setTextColor(75, 85, 99);
doc.text('For free food hygiene online training visit ', marginX, y + 6);
doc.setTextColor(37, 99, 235);
doc.text('www.brisbane.imalert.com.au', marginX + 54, y + 6);
doc.setTextColor(107, 114, 128);
doc.text('  左边网站链接有提供免费的食品卫生课程', marginX + 96, y + 6);

// Save outputs
const outBuffer = Buffer.from(doc.output('arraybuffer'));
const pubDir = path.resolve(process.cwd(), 'public');
fs.writeFileSync(path.join(pubDir, 'Food handler skills and knowledge checklist.pdf'), outBuffer);
fs.writeFileSync(path.join(pubDir, 'Food_handler_skills_and_knowledge_checklist.pdf'), outBuffer);

console.log('PDF files generated successfully! Size:', outBuffer.length);
