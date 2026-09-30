import fs from 'fs';
import path from 'path';
import { jsPDF } from 'jspdf';

// A4 Portrait: 210mm x 297mm
const doc = new jsPDF({
  orientation: 'portrait',
  unit: 'mm',
  format: 'a4',
});

const pw = 210;
const ph = 297;
const mx = 14;
const my = 14;
const cw = pw - mx * 2; // 182mm
const colW = (cw - 8) / 2; // 87mm
const col2X = mx + colW + 8;

function drawPageFooter(pageNum) {
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(7.5);
  doc.setTextColor(120, 120, 120);
  if (pageNum === 1) {
    doc.text('NAT 3092-06.2019', mx, ph - 10);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(50, 50, 50);
    doc.text('Australian Government', pw - mx - 46, ph - 12);
    doc.setFont('helvetica', 'normal');
    doc.text('Australian Taxation Office', pw - mx - 46, ph - 8.5);
  } else if (pageNum === 5) {
    doc.text('NAT 3092-06.2019 [DE-6078]', mx, ph - 8);
    doc.text('Sensitive (when completed)', pw / 2 - 18, ph - 8);
    doc.setFont('helvetica', 'bold');
    doc.text('30920619', pw - mx - 20, ph - 8);
  } else {
    doc.text(`${pageNum}`, mx, ph - 10);
    doc.text('Tax file number declaration', pw - mx - 38, ph - 10);
  }
}

function drawBullet(x, y, color = [50, 50, 50]) {
  doc.setFillColor(...color);
  doc.rect(x, y - 2, 1.8, 1.8, 'F');
}

function drawCheckRow(x, y, count, boxW = 5, boxH = 5.5, spacing = 0.8) {
  doc.setDrawColor(70, 70, 70);
  doc.setLineWidth(0.25);
  for (let i = 0; i < count; i++) {
    doc.rect(x + i * (boxW + spacing), y, boxW, boxH, 'S');
  }
}

// ================= PAGE 1 =================
doc.setFillColor(34, 150, 60); // Green bar
doc.rect(mx, my, 80, 5.5, 'F');
doc.setFont('helvetica', 'bold');
doc.setFontSize(8);
doc.setTextColor(255, 255, 255);
doc.text('Instructions and form for taxpayers', mx + 3, my + 3.8);

doc.setFont('helvetica', 'bold');
doc.setFontSize(32);
doc.setTextColor(26, 26, 26);
doc.text('Tax file number', mx, my + 24);
doc.text('declaration', mx, my + 35);

doc.setFont('helvetica', 'normal');
doc.setFontSize(10.5);
doc.setTextColor(50, 50, 50);
const leadText = 'Information you provide in this declaration will allow your payer to work out how much tax to withhold from payments made to you.';
const leadLines = doc.splitTextToSize(leadText, cw);
doc.text(leadLines, mx, my + 44);

doc.setDrawColor(34, 150, 60);
doc.setLineWidth(0.6);
doc.line(mx, my + 54, pw - mx, my + 54);

// Page 1 - Left Column
let curY = my + 63;
// Alert: Not application
doc.setFillColor(220, 53, 69);
doc.circle(mx + 3, curY + 2, 2.8, 'F');
doc.setTextColor(255, 255, 255);
doc.setFont('helvetica', 'bold');
doc.setFontSize(8);
doc.text('-', mx + 2.2, curY + 3.2);

doc.setFont('helvetica', 'bold');
doc.setFontSize(8.5);
doc.setTextColor(30, 30, 30);
doc.text('This is not a TFN application form.', mx + 9, curY + 1.5);
doc.setFont('helvetica', 'normal');
doc.text('To apply for a TFN, go to ato.gov.au/tfn', mx + 9, curY + 5.5);

curY += 13;
// Terms we use
doc.setFillColor(235, 155, 20);
doc.circle(mx + 3, curY + 2, 2.8, 'F');
doc.setTextColor(255, 255, 255);
doc.setFont('helvetica', 'bold');
doc.setFontSize(8);
doc.text('!', mx + 2.2, curY + 3.2);

doc.setFont('helvetica', 'bold');
doc.setFontSize(9);
doc.setTextColor(30, 30, 30);
doc.text('Terms we use', mx + 9, curY + 3);

curY += 7;
doc.setFont('helvetica', 'normal');
doc.setFontSize(8);
doc.text('When we say:', mx + 9, curY);
curY += 4;
drawBullet(mx + 9, curY);
doc.text('payer, we mean the business or individual making payments under the pay as you go (PAYG) withholding system', mx + 13, curY, { maxWidth: colW - 13 });
curY += 9;
drawBullet(mx + 9, curY);
doc.text('payee, we mean the individual being paid.', mx + 13, curY, { maxWidth: colW - 13 });

curY += 12;
// Who should complete this form?
doc.setFont('helvetica', 'bold');
doc.setFontSize(11);
doc.setTextColor(20, 20, 20);
doc.text('Who should complete this form?', mx, curY);

curY += 6;
doc.setFont('helvetica', 'normal');
doc.setFontSize(8);
doc.text('You should complete this form before you start to receive payments from a new payer – for example:', mx, curY, { maxWidth: colW });
curY += 8;
const bulletItems = [
  'payments for work and services as an employee, company director or office holder',
  'payments under return-to-work schemes, labour hire arrangements or other specified payments',
  'benefit and compensation payments',
  'superannuation benefits.'
];
bulletItems.forEach(b => {
  drawBullet(mx + 2, curY);
  const spl = doc.splitTextToSize(b, colW - 6);
  doc.text(spl, mx + 6, curY);
  curY += spl.length * 3.8 + 2;
});

curY += 4;
// Warning box
doc.setFillColor(235, 155, 20);
doc.circle(mx + 3, curY + 2, 2.8, 'F');
doc.setTextColor(255, 255, 255);
doc.setFont('helvetica', 'bold');
doc.setFontSize(8);
doc.text('!', mx + 2.2, curY + 3.2);

doc.setFont('helvetica', 'normal');
doc.setFontSize(7.8);
doc.setTextColor(40, 40, 40);
const warnText = 'You need to provide all information requested on this form. Providing the wrong information may lead to incorrect amounts of tax being withheld from payments made to you.';
doc.text(doc.splitTextToSize(warnText, colW - 10), mx + 9, curY + 1.5);

// Page 1 - Right Column
let rY = my + 63;
doc.setFillColor(235, 155, 20);
doc.circle(col2X + 3, rY + 2, 2.8, 'F');
doc.setTextColor(255, 255, 255);
doc.setFont('helvetica', 'bold');
doc.setFontSize(8);
doc.text('!', col2X + 2.2, rY + 3.2);

doc.setFont('helvetica', 'bold');
doc.setFontSize(8.5);
doc.setTextColor(30, 30, 30);
doc.text("You don't need to complete this form if you:", col2X + 9, rY + 3);

rY += 8;
const notNeed = [
  'are a beneficiary wanting to provide your tax file number (TFN) to the trustee of a closely held trust. For more information, visit ato.gov.au/trustsandtfnwithholding',
  'are receiving superannuation benefits from a super fund and have been taken to have quoted your TFN to the trustee of the super fund',
  'want to claim the seniors and pensioners tax offset by reducing the amount withheld from payments made to you. You should complete a withholding declaration form (NAT 3093)',
  'want to claim a zone, overseas forces or invalid and invalid carer tax offset by reducing the amount withheld from payments made to you. You should complete a withholding declaration form (NAT 3093).'
];
notNeed.forEach(n => {
  drawBullet(col2X + 2, rY);
  const spl = doc.splitTextToSize(n, colW - 6);
  doc.text(spl, col2X + 6, rY);
  rY += spl.length * 3.8 + 3;
});

rY += 8;
doc.setFillColor(0, 114, 206); // blue
doc.circle(col2X + 3, rY + 2, 2.8, 'F');
doc.setTextColor(255, 255, 255);
doc.setFont('helvetica', 'bold');
doc.text('>', col2X + 2.2, rY + 3.2);

doc.setFont('helvetica', 'normal');
doc.setFontSize(8.5);
doc.setTextColor(30, 30, 30);
doc.text('For more information about your entitlement,', col2X + 9, rY + 1.5);
doc.setFont('helvetica', 'bold');
doc.text('visit ato.gov.au/taxoffsets', col2X + 9, rY + 5.5);

drawPageFooter(1);

// ================= PAGE 2 =================
doc.addPage();
drawPageFooter(2);

doc.setFont('helvetica', 'bold');
doc.setFontSize(13);
doc.setTextColor(26, 26, 26);
doc.text('Section A: To be completed by the payee', mx, my + 6);

let p2L = my + 15;
// Question 1
doc.setFont('helvetica', 'bold');
doc.setFontSize(10);
doc.text('Question 1', mx, p2L);
p2L += 4.5;
doc.setFontSize(11);
doc.text('What is your tax file number (TFN)?', mx, p2L);
p2L += 5.5;

doc.setFont('helvetica', 'normal');
doc.setFontSize(8);
doc.setTextColor(40, 40, 40);
const q1Info = 'You should give your TFN to your employer only after you start work for them. Never give your TFN in a job application or over the internet.\n\nWe and your payer are authorised by the Taxation Administration Act 1953 to request your TFN. It’s not an offence not to quote your TFN. However, quoting your TFN reduces the risk of administrative errors and having extra tax withheld. Your payer is required to withhold the top rate of tax from all payments made to you if you do not provide your TFN or claim an exemption from quoting your TFN.';
doc.text(doc.splitTextToSize(q1Info, colW), mx, p2L);

p2L += 38;
doc.setFont('helvetica', 'bold');
doc.setFontSize(9);
doc.text('How do you find your TFN?', mx, p2L);
p2L += 4.5;
doc.setFont('helvetica', 'normal');
doc.setFontSize(8);
doc.text('You can find your TFN on any of the following:\n■ your income tax notice of assessment\n■ correspondence we send you\n■ a payment summary your payer issues to you.\n\nIf you have a tax agent, they may also be able to tell you. If you still can’t find your TFN, you can phone us on 13 28 61 between 8.00am and 6.00pm, Monday to Friday.', mx, p2L, { maxWidth: colW });

p2L += 34;
doc.setFont('helvetica', 'bold');
doc.setFontSize(9);
doc.text('You don’t have a TFN', mx, p2L);
p2L += 4.5;
doc.setFont('helvetica', 'normal');
doc.setFontSize(8);
doc.text('If you don’t have a TFN and want to provide a TFN to your payer, you will need to apply for one. For more information about applying for a TFN, visit ato.gov.au/tfn', mx, p2L, { maxWidth: colW });

p2L += 16;
doc.setFont('helvetica', 'bold');
doc.setFontSize(8.5);
doc.text('You may be able to claim an exemption from quoting your TFN.', mx, p2L);
p2L += 4;
doc.setFont('helvetica', 'normal');
doc.setFontSize(8);
doc.text('Print X in the appropriate box if you:\n■ have lodged a TFN application form or made an enquiry. You have 28 days to provide your TFN to your payer.\n■ are under 18 years of age and do not earn enough to pay tax, or receive certain pensions/benefits.', mx, p2L, { maxWidth: colW });

// Page 2 - Right Column
let p2R = my + 15;
doc.setFont('helvetica', 'bold');
doc.setFontSize(9);
doc.text('Providing your TFN to your super fund', col2X, p2R);
p2R += 4.5;
doc.setFont('helvetica', 'normal');
doc.setFontSize(8);
doc.text('Your payer must give your TFN to the super fund they pay your contributions to. If your super fund doesn’t have your TFN, you can provide it to them separately. This ensures all contributions are accepted, avoids extra tax, and helps trace accounts.', col2X, p2R, { maxWidth: colW });

p2R += 18;
doc.setFont('helvetica', 'bold');
doc.setFontSize(10);
doc.text('Question 2–6', col2X, p2R);
p2R += 4.5;
doc.setFont('helvetica', 'normal');
doc.setFontSize(8);
doc.text('Complete with your personal information (name, address, date of birth, and email address).', col2X, p2R, { maxWidth: colW });

p2R += 12;
doc.setFont('helvetica', 'bold');
doc.setFontSize(10);
doc.text('Question 7: On what basis are you paid?', col2X, p2R);
p2R += 4.5;
doc.setFont('helvetica', 'normal');
doc.setFontSize(8);
doc.text('Check with your payer if you’re not sure. Select from Full-time, Part-time, Casual, Superannuation or annuity, or Labour hire.', col2X, p2R, { maxWidth: colW });

p2R += 14;
doc.setFont('helvetica', 'bold');
doc.setFontSize(10);
doc.text('Question 8: Are you an Australian resident for tax purposes or a working holiday maker?', col2X, p2R);
p2R += 6.5;
doc.setFont('helvetica', 'normal');
doc.setFontSize(8);
doc.text('Generally, we consider you to be an Australian resident for tax purposes if you have always lived in Australia, now live here permanently, or are an overseas student doing a course taking more than six months.\n\nIf you are in Australia on a working holiday visa (subclass 417) or a work and holiday visa (subclass 462), place an X in the working holiday maker box.\n\nFor more information, visit ato.gov.au/whm or ato.gov.au/residency', col2X, p2R, { maxWidth: colW });

p2R += 40;
doc.setFillColor(235, 155, 20);
doc.circle(col2X + 3, p2R + 2, 2.8, 'F');
doc.setTextColor(255, 255, 255);
doc.setFont('helvetica', 'bold');
doc.text('!', col2X + 2.2, p2R + 3.2);

doc.setFont('helvetica', 'bold');
doc.setFontSize(8.5);
doc.setTextColor(30, 30, 30);
doc.text('Foreign resident tax rates are different', col2X + 9, p2R + 3);
p2R += 6;
doc.setFont('helvetica', 'normal');
doc.setFontSize(8);
doc.text('A higher rate of tax applies to a foreign resident’s taxable income and foreign residents are not entitled to a tax-free threshold.', col2X + 9, p2R, { maxWidth: colW - 9 });

// ================= PAGE 3 =================
doc.addPage();
drawPageFooter(3);

let p3L = my + 10;
doc.setFont('helvetica', 'bold');
doc.setFontSize(10);
doc.setTextColor(26, 26, 26);
doc.text('Question 9', mx, p3L);
p3L += 4.5;
doc.setFontSize(11);
doc.text('Do you want to claim the tax-free threshold from this payer?', mx, p3L, { maxWidth: colW });
p3L += 9;

doc.setFont('helvetica', 'normal');
doc.setFontSize(8);
doc.setTextColor(40, 40, 40);
const q9Info = 'The tax-free threshold is the amount of income you can earn each financial year that is not taxed. By claiming the threshold, you reduce the amount of tax that is withheld from your pay during the year.\n\nAnswer yes if you want to claim the tax-free threshold, you are an Australian resident for tax purposes, and one of the following applies:\n■ you are not currently claiming the tax-free threshold from another payer\n■ you are currently claiming the threshold from another payer and your total income from all sources will be less than the threshold.\n\nAnswer no if none of the above applies or you are a working holiday maker.';
doc.text(doc.splitTextToSize(q9Info, colW), mx, p3L);

p3L += 45;
doc.setFont('helvetica', 'bold');
doc.setFontSize(10);
doc.text('Question 10', mx, p3L);
p3L += 4.5;
doc.setFontSize(10);
doc.text('Do you have a HELP, VSL, FS, SSL or TSL debt?', mx, p3L, { maxWidth: colW });
p3L += 6;
doc.setFont('helvetica', 'normal');
doc.setFontSize(8);
const q10Info = 'Answer yes if you have a Higher Education Loan Program (HELP), VET Student Loan (VSL), Financial Supplement (FS), Student Start-up Loan (SSL) or Trade Support Loan (TSL) debt. Your payer will withhold additional amounts to cover compulsory repayments.\n\nAnswer no if you do not have any debt or have repaid it in full.';
doc.text(doc.splitTextToSize(q10Info, colW), mx, p3L);

p3L += 28;
doc.setFillColor(235, 155, 20);
doc.circle(mx + 3, p3L + 2, 2.8, 'F');
doc.setTextColor(255, 255, 255);
doc.setFont('helvetica', 'bold');
doc.text('!', mx + 2.2, p3L + 3.2);

doc.setFont('helvetica', 'bold');
doc.setFontSize(9);
doc.setTextColor(30, 30, 30);
doc.text('Sign and date the declaration', mx + 9, p3L + 3);
p3L += 6;
doc.setFont('helvetica', 'normal');
doc.setFontSize(8);
doc.text('Make sure you have answered all the questions in section A, then sign and date the declaration. Give your completed declaration to your payer to complete section B.', mx + 9, p3L, { maxWidth: colW - 9 });

// Page 3 - Right Column
let p3R = my + 10;
doc.setFont('helvetica', 'bold');
doc.setFontSize(12);
doc.setTextColor(26, 26, 26);
doc.text('Section B: To be completed by the payer', col2X, p3R);

p3R += 9;
doc.setFillColor(235, 155, 20);
doc.circle(col2X + 3, p3R + 2, 2.8, 'F');
doc.setTextColor(255, 255, 255);
doc.setFont('helvetica', 'bold');
doc.text('!', col2X + 2.2, p3R + 3.2);

doc.setFont('helvetica', 'bold');
doc.setFontSize(8.5);
doc.setTextColor(30, 30, 30);
doc.text('Important information for payers', col2X + 9, p3R + 3);
p3R += 6;
doc.setFont('helvetica', 'normal');
doc.setFontSize(8);
doc.text('See the reverse side of the form (Page 6) for detailed guidelines on employer obligations.', col2X + 9, p3R, { maxWidth: colW - 9 });

p3R += 14;
doc.setFillColor(0, 114, 206);
doc.circle(col2X + 3, p3R + 2, 2.8, 'F');
doc.setTextColor(255, 255, 255);
doc.setFont('helvetica', 'bold');
doc.text('>', col2X + 2.2, p3R + 3.2);

doc.setFont('helvetica', 'bold');
doc.setFontSize(9);
doc.setTextColor(30, 30, 30);
doc.text('Lodge online', col2X + 9, p3R + 3);
p3R += 6;
doc.setFont('helvetica', 'normal');
doc.setFontSize(8);
doc.text('Payers can lodge TFN declaration reports online if you have software that complies with ATO specifications.\n\nFor more information about lodging online, visit ato.gov.au/lodgetfndeclaration', col2X + 9, p3R, { maxWidth: colW - 9 });

// ================= PAGE 4 =================
doc.addPage();
drawPageFooter(4);

let p4L = my + 10;
doc.setFont('helvetica', 'bold');
doc.setFontSize(13);
doc.setTextColor(26, 26, 26);
doc.text('More information', mx, p4L);

p4L += 8;
doc.setFontSize(10);
doc.text('Internet', mx, p4L);
p4L += 5;
doc.setFont('helvetica', 'normal');
doc.setFontSize(8);
doc.text('■ For general information about TFNs, tax and super in Australia, visit ato.gov.au\n■ For information about applying for a TFN on the web, visit ato.gov.au/tfn\n■ For information about your super, visit ato.gov.au/checkyoursuper', mx, p4L, { maxWidth: colW });

p4L += 22;
doc.setFont('helvetica', 'bold');
doc.setFontSize(10);
doc.text('Useful products', mx, p4L);
p4L += 5;
doc.setFont('helvetica', 'normal');
doc.setFontSize(8);
doc.text('■ Medicare levy variation declaration (NAT 0929)\n■ Standard choice form (NAT 13080) to choose a super fund\n\nOther forms and publications are available at ato.gov.au/onlineordering or by phoning 1300 720 092.', mx, p4L, { maxWidth: colW });

p4L += 30;
doc.setFont('helvetica', 'bold');
doc.setFontSize(10);
doc.text('Our commitment to you', mx, p4L);
p4L += 5;
doc.setFont('helvetica', 'normal');
doc.setFontSize(7.8);
doc.text('We are committed to providing you with accurate, consistent and clear information to help you understand your rights and entitlements and meet your obligations.\n\nThis publication was current at June 2019.', mx, p4L, { maxWidth: colW });

// Page 4 - Right Column
let p4R = my + 10;
doc.setFont('helvetica', 'bold');
doc.setFontSize(10);
doc.text('Phone', col2X, p4R);
p4R += 5;
doc.setFont('helvetica', 'normal');
doc.setFontSize(8);
doc.text('■ Payee – 13 28 61 (8.00am–6.00pm, Mon–Fri)\n■ Payer – 13 28 66 (8.00am–6.00pm, Mon–Fri)\n■ Translating and Interpreting Service – 13 14 50\n■ National Relay Service – 13 36 77', col2X, p4R, { maxWidth: colW });

p4R += 28;
doc.setFont('helvetica', 'bold');
doc.setFontSize(10);
doc.text('Privacy of information', col2X, p4R);
p4R += 5;
doc.setFont('helvetica', 'normal');
doc.setFontSize(8);
doc.text('Taxation law authorises the ATO to collect information and disclose it to other government agencies. For information about your privacy, visit ato.gov.au/privacy', col2X, p4R, { maxWidth: colW });

p4R += 30;
doc.setFont('helvetica', 'bold');
doc.setFontSize(8);
doc.text('© Australian Taxation Office for the Commonwealth of Australia, 2019', col2X, p4R);
p4R += 5;
doc.setFont('helvetica', 'normal');
doc.setFontSize(7.5);
doc.text('Published by Australian Taxation Office, Canberra, June 2019\nDE-6078', col2X, p4R);

// ================= PAGE 5: THE FORM =================
doc.addPage();
drawPageFooter(5);

// Header box
doc.setFont('helvetica', 'bold');
doc.setFontSize(9);
doc.setTextColor(30, 30, 30);
doc.text('Australian Government', mx, my + 5);
doc.setFontSize(10);
doc.text('Australian Taxation Office', mx, my + 9);
doc.setFontSize(8);
doc.setFont('helvetica', 'normal');
doc.text('ato.gov.au', mx, my + 14);

doc.setFont('helvetica', 'bold');
doc.setFontSize(18);
doc.text('Tax file number declaration', mx + 60, my + 7);

doc.setFont('helvetica', 'normal');
doc.setFontSize(7);
doc.text('This declaration is NOT an application for a tax file number.\n■ Use a black or blue pen and print clearly in BLOCK LETTERS.\n■ Print X in the appropriate boxes.\n■ Read all the instructions before you complete this declaration.', mx + 60, my + 11.5);

doc.setDrawColor(30, 30, 30);
doc.setLineWidth(0.4);
doc.line(mx, my + 18, pw - mx, my + 18);

// SECTION A BANNER
doc.setFillColor(40, 40, 40);
doc.rect(mx, my + 20, cw, 6, 'F');
doc.setFont('helvetica', 'bold');
doc.setFontSize(9);
doc.setTextColor(255, 255, 255);
doc.text('Section A: To be completed by the PAYEE', mx + 3, my + 24.2);

let formY = my + 28;
doc.setTextColor(30, 30, 30);

// Q1: TFN
doc.setFont('helvetica', 'bold');
doc.setFontSize(8);
doc.text('1 What is your tax file number (TFN)?', mx, formY + 3);
drawCheckRow(mx + 60, formY, 9, 5, 5.5, 1);
formY += 8;

// Q2: Name
doc.text('2 What is your name?', mx, formY + 3);
doc.setFont('helvetica', 'normal');
doc.setFontSize(7.5);
doc.text('Title: [ ] Mr  [ ] Mrs  [ ] Miss  [ ] Ms', mx + 38, formY + 3);
formY += 5;
doc.setFontSize(7);
doc.text('Surname or family name:', mx, formY + 2.5);
drawCheckRow(mx + 38, formY - 1, 24, 4.8, 5, 0.8);
formY += 7;
doc.text('First given name:', mx, formY + 2.5);
drawCheckRow(mx + 38, formY - 1, 16, 4.8, 5, 0.8);
formY += 7;
doc.text('Other given names:', mx, formY + 2.5);
drawCheckRow(mx + 38, formY - 1, 16, 4.8, 5, 0.8);
formY += 8;

// Q3: Home address
doc.setFont('helvetica', 'bold');
doc.setFontSize(8);
doc.text('3 What is your home address in Australia?', mx, formY + 3);
formY += 5;
drawCheckRow(mx + 38, formY - 1, 24, 4.8, 5, 0.8);
formY += 7;
doc.setFont('helvetica', 'normal');
doc.setFontSize(7);
doc.text('Suburb/town/locality:', mx, formY + 2.5);
drawCheckRow(mx + 38, formY - 1, 16, 4.8, 5, 0.8);
doc.text('State:', mx + 130, formY + 2.5);
drawCheckRow(mx + 140, formY - 1, 3, 4.8, 5, 0.8);
doc.text('Postcode:', mx + 158, formY + 2.5);
drawCheckRow(mx + 170, formY - 1, 4, 4.8, 5, 0.8);
formY += 8;

// Q5: Email
doc.setFont('helvetica', 'bold');
doc.setFontSize(8);
doc.text('5 What is your primary e-mail address?', mx, formY + 3);
drawCheckRow(mx + 60, formY, 20, 4.8, 5, 0.8);
formY += 8;

// Q6: Date of birth
doc.text('6 What is your date of birth?', mx, formY + 3);
doc.setFont('helvetica', 'normal');
doc.setFontSize(7);
doc.text('Day', mx + 50, formY - 0.5);
drawCheckRow(mx + 50, formY + 1, 2, 4.8, 5, 0.8);
doc.text('Month', mx + 65, formY - 0.5);
drawCheckRow(mx + 65, formY + 1, 2, 4.8, 5, 0.8);
doc.text('Year', mx + 80, formY - 0.5);
drawCheckRow(mx + 80, formY + 1, 4, 4.8, 5, 0.8);
formY += 9;

// Q7: Basis paid
doc.setFont('helvetica', 'bold');
doc.setFontSize(8);
doc.text('7 On what basis are you paid? (select only one)', mx, formY + 3);
formY += 5;
doc.setFont('helvetica', 'normal');
doc.setFontSize(7.5);
doc.text('[ ] Full-time employment    [ ] Part-time employment    [ ] Labour hire    [ ] Superannuation/annuity    [ ] Casual employment', mx + 4, formY);
formY += 7;

// Q8: Residency
doc.setFont('helvetica', 'bold');
doc.setFontSize(8);
doc.text('8 Are you: (select only one)', mx, formY + 3);
formY += 5;
doc.setFont('helvetica', 'normal');
doc.setFontSize(7.5);
doc.text('[ ] An Australian resident for tax purposes    [ ] A foreign resident for tax purposes    OR    [ ] A working holiday maker', mx + 4, formY);
formY += 7;

// Q9: Tax-free threshold
doc.setFont('helvetica', 'bold');
doc.setFontSize(8);
doc.text('9 Do you want to claim the tax-free threshold from this payer?', mx, formY + 3);
doc.setFont('helvetica', 'normal');
doc.text('[ ] Yes    [ ] No', mx + 110, formY + 3);
formY += 7;

// Q10: HELP / VSL debt
doc.setFont('helvetica', 'bold');
doc.text('10 Do you have a HELP, VSL, FS, SSL or TSL debt?', mx, formY + 3);
doc.setFont('helvetica', 'normal');
doc.text('[ ] Yes    [ ] No', mx + 110, formY + 3);
formY += 8;

// Payee Declaration Box
doc.setDrawColor(60, 60, 60);
doc.setLineWidth(0.3);
doc.rect(mx, formY, cw, 17, 'S');
doc.setFont('helvetica', 'bold');
doc.setFontSize(7.5);
doc.text('DECLARATION by payee: I declare that the information I have given is true and correct.', mx + 3, formY + 4);
doc.setFont('helvetica', 'normal');
doc.setFontSize(7);
doc.text('Signature: _________________________________________ (You MUST SIGN here)', mx + 3, formY + 11);
doc.text('Date: ____ / ____ / ________', mx + 125, formY + 11);
doc.setFontSize(6.5);
doc.text('There are penalties for deliberately making a false or misleading statement.', mx + 3, formY + 15);

formY += 21;

// SECTION B BANNER
doc.setFillColor(40, 40, 40);
doc.rect(mx, formY, cw, 5.5, 'F');
doc.setFont('helvetica', 'bold');
doc.setFontSize(8.5);
doc.setTextColor(255, 255, 255);
doc.text('Section B: To be completed by the PAYER (if you are not lodging online)', mx + 3, formY + 3.8);

formY += 8;
doc.setTextColor(30, 30, 30);

// Payer Q1: ABN
doc.setFont('helvetica', 'bold');
doc.setFontSize(7.5);
doc.text('1 What is your Australian business number (ABN)?', mx, formY + 2.5);
drawCheckRow(mx + 75, formY - 1, 11, 4.5, 4.8, 0.8);
doc.text('Branch number:', mx + 140, formY + 2.5);
drawCheckRow(mx + 162, formY - 1, 3, 4.5, 4.8, 0.8);
formY += 7;

// Payer Q3: Registered Name
doc.text('3 What is your legal name or registered business name?', mx, formY + 2.5);
drawCheckRow(mx + 75, formY - 1, 20, 4.5, 4.8, 0.8);
formY += 7;

// Payer Q4: Business address
doc.text('4 What is your business address?', mx, formY + 2.5);
drawCheckRow(mx + 75, formY - 1, 20, 4.5, 4.8, 0.8);
formY += 7;

// Payer Q6: Contact person & phone
doc.text('6 Who is your contact person?', mx, formY + 2.5);
drawCheckRow(mx + 75, formY - 1, 12, 4.5, 4.8, 0.8);
doc.text('Phone:', mx + 140, formY + 2.5);
drawCheckRow(mx + 152, formY - 1, 6, 4.5, 4.8, 0.8);
formY += 7;

// Payer Declaration Box
doc.rect(mx, formY, cw, 12, 'S');
doc.setFont('helvetica', 'bold');
doc.setFontSize(7.5);
doc.text('DECLARATION by payer: I declare that the information I have given is true and correct.', mx + 3, formY + 4);
doc.setFont('helvetica', 'normal');
doc.setFontSize(7);
doc.text('Signature of payer: ____________________________________', mx + 3, formY + 9);
doc.text('Date: ____ / ____ / ________', mx + 125, formY + 9);

// ================= PAGE 6: PAYER INFORMATION =================
doc.addPage();
drawPageFooter(6);

let p6L = my + 10;
doc.setFont('helvetica', 'bold');
doc.setFontSize(14);
doc.setTextColor(26, 26, 26);
doc.text('Payer information', mx, p6L);
p6L += 5;
doc.setFont('helvetica', 'normal');
doc.setFontSize(8);
doc.setTextColor(50, 50, 50);
doc.text('The following information will help you comply with your pay as you go (PAYG) withholding obligations.', mx, p6L, { maxWidth: colW });

p6L += 10;
doc.setFillColor(220, 53, 69);
doc.circle(mx + 3, p6L + 2, 2.8, 'F');
doc.setTextColor(255, 255, 255);
doc.setFont('helvetica', 'bold');
doc.text('-', mx + 2.2, p6L + 3.2);

doc.setFont('helvetica', 'bold');
doc.setFontSize(8.5);
doc.setTextColor(30, 30, 30);
doc.text('Is your employee entitled to work in Australia?', mx + 9, p6L + 3);
p6L += 6;
doc.setFont('helvetica', 'normal');
doc.setFontSize(7.8);
const workRight = 'It is a criminal offence to knowingly or recklessly allow someone to work where that person is from overseas and is in Australia illegally or in breach of their visa conditions.\n\nEnsure your prospective employee has a valid visa to work in Australia before you employ them. For more information, visit homeaffairs.gov.au';
doc.text(doc.splitTextToSize(workRight, colW - 9), mx + 9, p6L);

p6L += 26;
doc.setFont('helvetica', 'bold');
doc.setFontSize(9);
doc.text('Working holiday visa holders (subclass 417 & 462)', mx, p6L);
p6L += 5;
doc.setFont('helvetica', 'normal');
doc.setFontSize(7.8);
doc.text('Employers of workers under these visas need to register with the ATO at ato.gov.au/whmreg\nFor the tax table "working holiday maker" visit ato.gov.au/taxtables', mx, p6L, { maxWidth: colW });

p6L += 18;
doc.setFont('helvetica', 'bold');
doc.setFontSize(10);
doc.text('Payer obligations', mx, p6L);
p6L += 5;
doc.setFont('helvetica', 'normal');
doc.setFontSize(7.8);
doc.text('If you withhold amounts from payments, the payee may give you this form with Section A completed. The information is used to determine tax to withhold based on PAYG withholding tax tables.\n\nWhere the payee has applied for a TFN, they have 28 days to provide it. You withhold at standard rates for 28 days, then top rate if not provided.', mx, p6L, { maxWidth: colW });

// Page 6 - Right Column
let p6R = my + 10;
doc.setFont('helvetica', 'bold');
doc.setFontSize(10);
doc.text('Lodging the form', col2X, p6R);
p6R += 5;
doc.setFont('helvetica', 'normal');
doc.setFontSize(7.8);
doc.text('You need to lodge TFN declarations with us within 14 days after the form is signed by the payee or completed by you. You need to retain a copy for your records.\n\n■ online – lodge reports using software complying with ATO specifications\n■ by paper – complete Section B and send original within 14 days to:\n  Australian Taxation Office, PO Box 9004, PENRITH NSW 2740', col2X, p6R, { maxWidth: colW });

p6R += 30;
doc.setFont('helvetica', 'bold');
doc.setFontSize(9.5);
doc.text('Provision of payee’s TFN to super fund', col2X, p6R);
p6R += 5;
doc.setFont('helvetica', 'normal');
doc.setFontSize(7.8);
doc.text('Give your payee’s TFN to their super fund on the day of contribution, or within 14 days of receiving this form.', col2X, p6R, { maxWidth: colW });

p6R += 16;
doc.setFont('helvetica', 'bold');
doc.setFontSize(9.5);
doc.text('Storing and disposing of TFN declarations', col2X, p6R);
p6R += 5;
doc.setFont('helvetica', 'normal');
doc.setFontSize(7.8);
doc.text('The TFN Rule issued under the Privacy Act 1988 requires secure storage. Retain copies for the current and following financial year.', col2X, p6R, { maxWidth: colW });

p6R += 18;
doc.setFillColor(220, 53, 69);
doc.circle(col2X + 3, p6R + 2, 2.8, 'F');
doc.setTextColor(255, 255, 255);
doc.setFont('helvetica', 'bold');
doc.text('-', col2X + 2.2, p6R + 3.2);

doc.setFont('helvetica', 'bold');
doc.setFontSize(9);
doc.setTextColor(30, 30, 30);
doc.text('Penalties', col2X + 9, p6R + 3);
p6R += 5;
doc.setFont('helvetica', 'normal');
doc.setFontSize(7.8);
doc.text('You may incur a penalty if you do not lodge TFN declarations, keep copies, or provide the TFN to the employee’s super fund.', col2X + 9, p6R, { maxWidth: colW - 9 });

// Save outputs
const outBuffer = Buffer.from(doc.output('arraybuffer'));
const pubDir = path.resolve(process.cwd(), 'public');
const outPath = path.join(pubDir, 'TFN_declaration_form_N3092.pdf');
fs.writeFileSync(outPath, outBuffer);

// Also copy to dist if dist exists
const distDir = path.resolve(process.cwd(), 'dist');
if (fs.existsSync(distDir)) {
  fs.writeFileSync(path.join(distDir, 'TFN_declaration_form_N3092.pdf'), outBuffer);
}

console.log('TFN declaration form PDF generated successfully! Size:', outBuffer.length);
