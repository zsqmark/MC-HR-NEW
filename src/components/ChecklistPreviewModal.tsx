import React, { useState } from 'react';
import { Download, Printer, X, Check, ExternalLink, ShieldCheck, FileText } from 'lucide-react';

interface ChecklistPreviewModalProps {
  isOpen: boolean;
  onClose: () => void;
  pdfUrl?: string;
}

export const ChecklistPreviewModal: React.FC<ChecklistPreviewModalProps> = ({
  isOpen,
  onClose,
  pdfUrl = '/Food handler skills and knowledge checklist.pdf',
}) => {
  const [initials, setInitials] = useState<Record<number, string>>({
    1: '',
    2: '',
    3: '',
    4: '',
    5: '',
    6: '',
  });

  if (!isOpen) return null;

  const handlePrint = () => {
    window.print();
  };

  const handleInitialChange = (index: number, val: string) => {
    setInitials((prev) => ({ ...prev, [index]: val.toUpperCase().slice(0, 4) }));
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-black/60 backdrop-blur-xs flex items-center justify-center p-3 sm:p-6 print:p-0 print:bg-white print:static">
      <div className="bg-white rounded-2xl shadow-2xl max-w-4xl w-full border border-slate-200 overflow-hidden flex flex-col max-h-[92vh] print:max-h-none print:shadow-none print:border-none print:rounded-none">
        {/* Top Control Bar (Hidden on print) */}
        <div className="px-6 py-4 bg-slate-900 text-white flex flex-wrap items-center justify-between gap-3 shrink-0 print:hidden">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-amber-500/20 text-amber-400 border border-amber-500/30 flex items-center justify-center">
              <FileText className="w-4 h-4" />
            </div>
            <div>
              <div className="text-xs font-semibold text-amber-400 tracking-wide uppercase">
                Official Compliance Document
              </div>
              <h2 className="text-sm sm:text-base font-bold text-white tracking-tight">
                Food handler skills and knowledge checklist
              </h2>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <a
              href={pdfUrl}
              download="Food handler skills and knowledge checklist.pdf"
              className="inline-flex items-center gap-1.5 px-3.5 py-1.5 bg-amber-500 hover:bg-amber-600 text-slate-950 rounded-xl text-xs font-bold shadow-xs transition-colors cursor-pointer"
            >
              <Download className="w-3.5 h-3.5" />
              <span>Download PDF</span>
            </a>

            <button
              onClick={handlePrint}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-xl text-xs font-medium border border-slate-700 transition-colors cursor-pointer"
            >
              <Printer className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Print</span>
            </button>

            <button
              onClick={onClose}
              className="p-1.5 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 transition-colors cursor-pointer"
              title="Close modal"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Document Content Scroll Area */}
        <div className="p-6 sm:p-10 overflow-y-auto space-y-6 text-slate-800 text-xs sm:text-sm font-sans print:p-4">
          {/* Document Header */}
          <div className="space-y-4 border-b border-slate-200 pb-5">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-amber-500 to-red-500 flex items-center justify-center shadow-xs">
                  <span className="text-white font-bold text-xs">MC</span>
                </div>
                <div>
                  <span className="font-extrabold text-slate-800 text-lg tracking-tight uppercase">MALAYA CORNER</span>
                  <span className="ml-2 font-bold text-slate-500 text-base">旺角</span>
                </div>
              </div>
              <span className="text-[11px] font-semibold text-amber-700 bg-amber-50 px-2.5 py-1 rounded-full border border-amber-200 print:hidden">
                Standard 3.2.2A
              </span>
            </div>

            <h1 className="text-lg sm:text-xl font-extrabold text-amber-600 tracking-tight leading-snug">
              Food handler skills and knowledge checklist 食品加工人员技能和知识清单
            </h1>

            <div className="p-3.5 bg-amber-50/70 rounded-xl border border-amber-200 text-xs leading-relaxed text-slate-700 space-y-1.5">
              <p>
                As a food handler, you have certain legal obligations to help protect both your customers and you from potential food borne illness. Please complete this checklist after completing your food safety training. If you have any questions, ask your supervisor for advice. Place your initials in each box once you have understood each section. It is important that you understand these obligations, so please ask for clarification from your supervisor if you require assistance.
              </p>
              <p className="text-slate-600 pt-1 border-t border-amber-200/60 font-sans">
                作为食品加工人员，您有一定的法律义务来帮助保护您的客户和您免受潜在的食源性疾病的侵害。 请在完成食品安全培训后填写此清单。 如果您有任何问题，请向您的主管寻求建议。一旦您理解了每个部分，请将您的姓名首字母放在每个框中。 了解这些义务很重要，因此如果您需要帮助，请向您的主管寻求说明。
              </p>
            </div>
          </div>

          {/* Table */}
          <div className="border border-slate-300 rounded-xl overflow-hidden shadow-xs">
            {/* Table Header */}
            <div className="bg-amber-500 text-white font-bold text-xs sm:text-sm grid grid-cols-12 px-4 py-2.5">
              <div className="col-span-10 sm:col-span-10">Obligations (义务)</div>
              <div className="col-span-2 sm:col-span-2 text-center border-l border-amber-400 pl-2">Signature (签名)</div>
            </div>

            {/* Row 1 */}
            <div className="grid grid-cols-12 border-t border-slate-200 bg-white">
              <div className="col-span-10 p-3 sm:p-4 space-y-1 text-slate-700 leading-relaxed text-xs">
                <p className="font-medium text-slate-900">
                  As a food handler, I must take all reasonable measures not to handle food or surfaces likely to come into contact with food in a way that is likely to compromise the safety and suitability of food.
                </p>
                <p className="text-slate-600">
                  作为一名食品处理人员，我必须采取一切合理措施，避免以可能损害食品安全性和适用性的方式处理食品或可能与食品接触的表面。
                </p>
              </div>
              <div className="col-span-2 border-l border-slate-200 p-2 sm:p-3 flex flex-col items-center justify-center bg-slate-50">
                <input
                  type="text"
                  placeholder="Initials"
                  maxLength={4}
                  value={initials[1]}
                  onChange={(e) => handleInitialChange(1, e.target.value)}
                  className="w-full max-w-[70px] text-center uppercase font-mono font-bold text-xs p-1.5 border border-slate-300 rounded-lg bg-white focus:outline-none focus:ring-1 focus:ring-amber-500"
                />
              </div>
            </div>

            {/* Row 2 */}
            <div className="grid grid-cols-12 border-t border-slate-200 bg-slate-50/50">
              <div className="col-span-10 p-3 sm:p-4 space-y-1.5 text-slate-700 leading-relaxed text-xs">
                <p className="font-medium text-slate-900">
                  As a food handler, if I have a condition or a symptom that indicates that I may be suffering from a food borne disease, or if I know I am suffering from a food borne disease, or that I am a carrier of a food borne disease, whilst at work I must:
                </p>
                <p className="text-slate-600">
                  作为一名食品处理人员，如果我有某种状况或症状表明我可能患有食源性疾病，或者如果我知道自己患有食源性疾病，或者我是食源性疾病的携带者 ，在工作时我必须：
                </p>
                <ul className="list-disc list-inside space-y-1 pl-2 text-slate-700">
                  <li>
                    <strong className="text-slate-900">report this to my supervisor;</strong> 将此情况报告给我的主管
                  </li>
                  <li>
                    <strong className="text-slate-900">not engage in any handling of food</strong> where there is a likelihood that I might contaminate food as a result of the disease or condition; and 在我可能在疾病或状况而污染食物的情况下，不从事任何食物处理； 和
                  </li>
                  <li>
                    <strong className="text-slate-900">take all practicable measures</strong> to prevent food from being contaminated as a result of the disease or condition if my supervisor allows me to do other work on the food premises. 如果我的主管允许我在食肆从事其他工作，请采取一切切实可行的措施来防止食物因疾病或状况而受到污染。
                  </li>
                </ul>
              </div>
              <div className="col-span-2 border-l border-slate-200 p-2 sm:p-3 flex flex-col items-center justify-center bg-slate-50">
                <input
                  type="text"
                  placeholder="Initials"
                  maxLength={4}
                  value={initials[2]}
                  onChange={(e) => handleInitialChange(2, e.target.value)}
                  className="w-full max-w-[70px] text-center uppercase font-mono font-bold text-xs p-1.5 border border-slate-300 rounded-lg bg-white focus:outline-none focus:ring-1 focus:ring-amber-500"
                />
              </div>
            </div>

            {/* Row 3 */}
            <div className="grid grid-cols-12 border-t border-slate-200 bg-white">
              <div className="col-span-10 p-3 sm:p-4 space-y-1 text-slate-700 leading-relaxed text-xs">
                <p className="font-medium text-slate-900">
                  As a food handler, I must notify my supervisor if I know or suspect that I may have contaminated any food that I have handled.
                </p>
                <p className="text-slate-600">
                  作为一名食品处理人员，如果我知道或怀疑我可能污染了我处理过的任何食品，我必须通知我的主管。
                </p>
              </div>
              <div className="col-span-2 border-l border-slate-200 p-2 sm:p-3 flex flex-col items-center justify-center bg-slate-50">
                <input
                  type="text"
                  placeholder="Initials"
                  maxLength={4}
                  value={initials[3]}
                  onChange={(e) => handleInitialChange(3, e.target.value)}
                  className="w-full max-w-[70px] text-center uppercase font-mono font-bold text-xs p-1.5 border border-slate-300 rounded-lg bg-white focus:outline-none focus:ring-1 focus:ring-amber-500"
                />
              </div>
            </div>

            {/* Row 4 */}
            <div className="grid grid-cols-12 border-t border-slate-200 bg-slate-50/50">
              <div className="col-span-10 p-3 sm:p-4 space-y-1.5 text-slate-700 leading-relaxed text-xs">
                <p className="font-medium text-slate-900">
                  As a food handler, when engaging in any food handling operation, I must:
                </p>
                <p className="text-slate-600">
                  作为一名食品处理人员，在从事任何食品处理操作时，我必须：
                </p>
                <ul className="list-disc list-inside space-y-1 pl-2 text-slate-700">
                  <li>
                    take all practicable measures to ensure my body, anything from my body, and anything I am wearing does not contaminate food or surfaces likely to come into contact with food; 采取一切切实可行的措施，确保我的身体、我身上的任何东西以及我所穿的任何东西都不会污染食物或可能与食物接触的表面
                  </li>
                  <li>
                    take all practicable measures to prevent unnecessary contact with ready-to-eat food; 采取一切切实可行的措施防止不必要地接触即食食品
                  </li>
                  <li>
                    ensure my outer clothing is of a level of cleanliness that is appropriate for the handling of food that I am involved with; 确保我的外衣达到适合处理我所涉及的食物的清洁度
                  </li>
                  <li>
                    cover any exposed bandages and dressings with highly visible waterproof coverings; 用高度可见的防水覆盖物覆盖任何暴露的绷带和敷料
                  </li>
                  <li>
                    not eat over unprotected food or surfaces likely to come into contact with food; 不要在未受保护的食物或可能与食物接触的表面上进食；
                  </li>
                  <li>
                    not sneeze, blow or cough over unprotected food or surfaces likely to come into contact with food; 不要在未受保护的食物或可能与食物接触的表面上打喷嚏、吹气或咳嗽
                  </li>
                  <li>
                    not spit, smoke or use tobacco or similar preparations in areas in which food is handled; and 不得在处理食品的区域吐痰、吸烟或使用烟草或类似制品； 和
                  </li>
                  <li>
                    always use the designated toilet facilities. 始终使用指定的厕所设施。
                  </li>
                </ul>
              </div>
              <div className="col-span-2 border-l border-slate-200 p-2 sm:p-3 flex flex-col items-center justify-center bg-slate-50">
                <input
                  type="text"
                  placeholder="Initials"
                  maxLength={4}
                  value={initials[4]}
                  onChange={(e) => handleInitialChange(4, e.target.value)}
                  className="w-full max-w-[70px] text-center uppercase font-mono font-bold text-xs p-1.5 border border-slate-300 rounded-lg bg-white focus:outline-none focus:ring-1 focus:ring-amber-500"
                />
              </div>
            </div>

            {/* Row 5 */}
            <div className="grid grid-cols-12 border-t border-slate-200 bg-white">
              <div className="col-span-10 p-3 sm:p-4 space-y-1.5 text-slate-700 leading-relaxed text-xs">
                <p className="font-medium text-slate-900">
                  As a food handler, I must wash my hands:
                </p>
                <p className="text-slate-600">
                  作为食品加工人员，我必须洗手：
                </p>
                <ul className="list-disc list-inside space-y-1 pl-2 text-slate-700">
                  <li>whenever they are likely to be a source of contamination of food; 每当它们可能成为食品污染源时；</li>
                  <li>immediately before working with ready-to-eat food or after handling raw food; 在处理即食食品之前或处理生食之后；</li>
                  <li>immediately after using the toilet; 上完厕所后立即；</li>
                  <li>before commencing or re-commencing handling food; 在开始或重新开始处理食物之前；</li>
                  <li>immediately after smoking, coughing, sneezing, using a handkerchief or disposable tissue, eating, drinking or using tobacco or similar substances; and 吸烟、咳嗽、打喷嚏、使用手帕或一次性纸巾、进食、饮水或使用烟草或类似物质后立即； 和</li>
                  <li>after touching my hair, scalp or a body opening. 触摸我的头发、头皮或身体开口后。</li>
                </ul>
              </div>
              <div className="col-span-2 border-l border-slate-200 p-2 sm:p-3 flex flex-col items-center justify-center bg-slate-50">
                <input
                  type="text"
                  placeholder="Initials"
                  maxLength={4}
                  value={initials[5]}
                  onChange={(e) => handleInitialChange(5, e.target.value)}
                  className="w-full max-w-[70px] text-center uppercase font-mono font-bold text-xs p-1.5 border border-slate-300 rounded-lg bg-white focus:outline-none focus:ring-1 focus:ring-amber-500"
                />
              </div>
            </div>

            {/* Row 6 */}
            <div className="grid grid-cols-12 border-t border-slate-200 bg-slate-50/50">
              <div className="col-span-10 p-3 sm:p-4 space-y-1.5 text-slate-700 leading-relaxed text-xs">
                <p className="font-medium text-slate-900">
                  As a food handler, I must wash my hands in the manner described below, when engaging in a food handling operation that involves unprotected food or surfaces likely to come into contact with food:
                </p>
                <p className="text-slate-600">
                  作为一名食品处理人员，在从事涉及未受保护的食品或可能与食品接触的表面的食品处理操作时，我必须以下述方式洗手：
                </p>
                <ul className="list-disc list-inside space-y-1 pl-2 text-slate-700">
                  <li>with warm running water; and 用温水； 和</li>
                  <li>using soap 使用肥皂</li>
                </ul>
              </div>
              <div className="col-span-2 border-l border-slate-200 p-2 sm:p-3 flex flex-col items-center justify-center bg-slate-50">
                <input
                  type="text"
                  placeholder="Initials"
                  maxLength={4}
                  value={initials[6]}
                  onChange={(e) => handleInitialChange(6, e.target.value)}
                  className="w-full max-w-[70px] text-center uppercase font-mono font-bold text-xs p-1.5 border border-slate-300 rounded-lg bg-white focus:outline-none focus:ring-1 focus:ring-amber-500"
                />
              </div>
            </div>
          </div>

          {/* Footer Reference */}
          <div className="p-3.5 bg-slate-100 rounded-xl flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-xs text-slate-600">
            <div>
              For free food hygiene online training visit{' '}
              <a
                href="https://www.brisbane.imalert.com.au"
                target="_blank"
                rel="noopener noreferrer"
                className="text-blue-600 font-bold hover:underline inline-flex items-center gap-1"
              >
                www.brisbane.imalert.com.au
                <ExternalLink className="w-3 h-3 inline" />
              </a>
              <span className="text-slate-500 ml-2">左边网站链接有提供免费的食品卫生课程</span>
            </div>
            <div className="flex items-center gap-1.5 text-emerald-700 font-semibold shrink-0">
              <ShieldCheck className="w-4 h-4 text-emerald-600" />
              <span>BCC Food Safety Star Compliance</span>
            </div>
          </div>
        </div>

        {/* Footer actions */}
        <div className="px-6 py-4 bg-slate-50 border-t border-slate-200 flex flex-wrap items-center justify-between gap-3 shrink-0 print:hidden">
          <span className="text-xs text-slate-500">
            Complete, sign, and upload this document to question 13 of your onboarding form.
          </span>

          <div className="flex items-center gap-2">
            <a
              href={pdfUrl}
              download="Food handler skills and knowledge checklist.pdf"
              className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs rounded-xl shadow-xs transition-colors flex items-center gap-1.5"
            >
              <Download className="w-3.5 h-3.5" />
              Download Official PDF
            </a>
            <button
              onClick={onClose}
              className="px-4 py-2 bg-white hover:bg-slate-100 text-slate-700 border border-slate-300 font-semibold text-xs rounded-xl transition-colors cursor-pointer"
            >
              Close
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
