export type DecisionTag = "坚定定投" | "持基观望" | "分批逃跑";

export type DiagnosticDetails = {
  managerAnalysis: string;
  drawdownAnalysis: string;
  trackValuation: string;
};

export type FundAnalysis = {
  fundName: string;
  fundCode: string;
  decisionTag: DecisionTag;
  oneSentenceConclusion: string;
  diagnosticDetails: DiagnosticDetails;
  actionSuggestions: string[];
};

export type ChatMessage = {
  id: string;
  role: "user" | "assistant";
  content: string;
};

export type AnalyzeApiResponse =
  | { success: true; data: FundAnalysis }
  | { success: false; error: string };

export type ChatRequestBody = {
  analysis: FundAnalysis;
  messages: Array<{ role: "user" | "assistant"; content: string }>;
  question: string;
};
