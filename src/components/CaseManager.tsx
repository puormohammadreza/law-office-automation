import { safeStorage } from "../utils/safeStorage";
import React, { useState, useEffect } from "react";
import { Client, LegalCase, CaseNote, CaseDocument, CaseStage, CaseStatus, ClientPartyRole, LegalEvent, CaseCategory } from "../types";
import { toPersianDigits, toEnglishDigits, formatDateWithSlash, getCurrentJalali, formatJalaliDate } from "../utils/shamsi";
import { documentDb } from "../utils/documentStorage";
import {
  FolderPlus,
  UserPlus,
  User,
  Users,
  FileText,
  Trash2,
  Paperclip,
  Plus,
  Calendar,
  AlertCircle,
  Clock,
  Briefcase,
  Layers,
  MapPin,
  CheckCircle2,
  FileUp,
  Image as ImageIcon,
  Printer,
  Coins,
  CreditCard,
  Search,
  Eye,
  Edit2,
  RefreshCw,
  FolderArchive,
  Bell,
  MessageCircle,
  ChevronUp,
  ChevronDown,
  TrendingUp,
  PiggyBank,
  Sparkles,
  ArrowLeft,
  Camera,
  Folder
} from "lucide-react";

interface CaseManagerProps {
  defaultSubTab?: "cases" | "closedCases" | "clients";
  clients: Client[];
  cases: LegalCase[];
  notes: CaseNote[];
  documents: CaseDocument[];
  onAddClient: (newClient: Client) => void;
  onAddCase: (newCase: LegalCase) => void;
  onUpdateCase: (updatedCase: LegalCase) => void;
  onAddNote: (newNote: CaseNote) => void;
  onUpdateNote: (id: string, title: string, content: string) => void;
  onDeleteNote: (id: string) => void;
  onAddDocument: (newDoc: CaseDocument) => void;
  onUpdateDocument: (id: string, updates: Partial<CaseDocument>) => void;
  onDeleteDocument: (id: string) => void;
  onDeleteCase: (id: string) => void;
  onDeleteClient: (id: string) => void;
  onUpdateClient: (updatedClient: Client) => void;
  onNavigateToAlarms?: () => void;
  onUpdateDocumentList?: (updatedDocs: CaseDocument[]) => void;
  onNavigate?: (tab: string) => void;
  initialCaseId?: string;
  initialOpenNotes?: boolean;
  events?: LegalEvent[];
}

const hasValue = (val: any): boolean => {
  if (val === undefined || val === null) return false;
  if (typeof val === "string") {
    const trimmed = val.trim();
    return trimmed !== "" && trimmed !== "-" && trimmed !== "۰" && trimmed !== "0";
  }
  if (typeof val === "number") {
    return val > 0;
  }
  return true;
};

export default function CaseManager({
  clients,
  cases,
  notes,
  documents,
  onAddClient,
  onAddCase,
  onUpdateCase,
  onAddNote,
  onUpdateNote,
  onDeleteNote,
  onAddDocument,
  onUpdateDocument,
  onDeleteDocument,
  onDeleteCase,
  onDeleteClient,
  onUpdateClient,
  onNavigateToAlarms,
  onUpdateDocumentList,
  onNavigate,
  defaultSubTab = "cases",
  initialCaseId,
  initialOpenNotes,
  events = []
}: CaseManagerProps) {
  const lawyerName = safeStorage.getItem("r_lawyer_name") || "";
  // Tabs: "cases" | "closedCases" | "clients"
  const [subTab, setSubTab] = useState<"cases" | "closedCases" | "clients">(defaultSubTab);
  
  // Keep subTab synced if defaultSubTab changes from external navigation
  useEffect(() => {
    setSubTab(defaultSubTab);
  }, [defaultSubTab]);

  const [searchTerm, setSearchTerm] = useState("");

  // Selection states
  const [selectedCase, setSelectedCase] = useState<LegalCase | null>(null);

  useEffect(() => {
    if (initialCaseId) {
      const foundCase = cases.find(c => c.id === initialCaseId);
      if (foundCase) {
        if (initialOpenNotes) {
          setShowNotesManager(foundCase);
          setSelectedCase(null);
        } else {
          setSelectedCase(foundCase);
          setShowNotesManager(null);
        }
        if (foundCase.status === "مختومه") {
          setSubTab("closedCases");
        } else {
          setSubTab("cases");
        }
      }
    }
  }, [initialCaseId, cases, initialOpenNotes]);

  const moveDocument = (docId: string, direction: "up" | "down") => {
    if (!selectedCase) return;
    const caseDocs = documents.filter(d => d.caseId === selectedCase.id);
    const index = caseDocs.findIndex(d => d.id === docId);
    if (index === -1) return;

    const targetIndex = direction === "up" ? index - 1 : index + 1;
    if (targetIndex < 0 || targetIndex >= caseDocs.length) return;

    const updatedCaseDocs = [...caseDocs];
    const temp = updatedCaseDocs[index];
    updatedCaseDocs[index] = updatedCaseDocs[targetIndex];
    updatedCaseDocs[targetIndex] = temp;

    let caseDocPtr = 0;
    const newGlobalDocs = documents.map(doc => {
      if (doc.caseId === selectedCase.id) {
        return updatedCaseDocs[caseDocPtr++];
      }
      return doc;
    });

    if (onUpdateDocumentList) {
      onUpdateDocumentList(newGlobalDocs);
    }
  };
  const [showNotesManager, setShowNotesManager] = useState<LegalCase | null>(null);
  const [printableCase, setPrintableCase] = useState<LegalCase | null>(null);
  const [caseFinanceViewCase, setCaseFinanceViewCase] = useState<LegalCase | null>(null);
  const [printableClient, setPrintableClient] = useState<Client | null>(null);
  const [contactClient, setContactClient] = useState<Client | null>(null);
  const [includeFinancialInPrint, setIncludeFinancialInPrint] = useState(true);

  const getStandardPhone = (phone: string) => {
    if (!phone) return "";
    const p2e = (s: string) => s.replace(/[۰-۹]/g, d => '۰۱۲۳۴۵۶۷۸۹'.indexOf(d).toString()).replace(/[٠-٩]/g, d => '٠١٢٣٤٥٦٧٨٩'.indexOf(d).toString());
    const processed = p2e(phone).replace(/\D/g, '');
    return processed.replace(/^0/, '');
  };

  // Form toggles
  const [showClientForm, setShowClientForm] = useState(false);
  const [editingClient, setEditingClient] = useState<Client | null>(null);
  const [showCaseForm, setShowCaseForm] = useState(false);
  const [showCaseTypeModal, setShowCaseTypeModal] = useState(false);
  const [editingCase, setEditingCase] = useState<LegalCase | null>(null);

  // --- New Client Form States ---
  const [clientName, setClientName] = useState("");
  const [clientNatId, setClientNatId] = useState("");
  const [clientPhone, setClientPhone] = useState("");
  const [clientFather, setClientFather] = useState("");
  const [clientAddress, setClientAddress] = useState("");
  const [clientBirthDate, setClientBirthDate] = useState("");
  const [clientDesc, setClientDesc] = useState("");

  // --- New Case Form States ---
  const [selectedCaseCategory, setSelectedCaseCategory] = useState<CaseCategory>("حقوقی");
  const [caseFormStep, setCaseFormStep] = useState(1); // 1: General, 2: Finance
  const [caseClientId, setCaseClientId] = useState("");
  const [caseNo, setCaseNo] = useState("");
  const [courtCaseNo, setCourtCaseNo] = useState("");
  const [caseArchiveNo, setCaseArchiveNo] = useState("");
  const [appealCaseNo, setAppealCaseNo] = useState("");
  const [rejectionCaseNo, setRejectionCaseNo] = useState("");
  const [supremeCaseNo, setSupremeCaseNo] = useState("");
  const [executionCaseNo, setExecutionCaseNo] = useState("");
  const [executionCivilCaseNo, setExecutionCivilCaseNo] = useState("");
  const [insolvencyCaseNo, setInsolvencyCaseNo] = useState("");
  const [investigationCaseNo, setInvestigationCaseNo] = useState("");
  const [prosecutionCaseNo, setProsecutionCaseNo] = useState("");
  const [caseFilingDate, setCaseFilingDate] = useState("");
  const [caseCourtRegistrationDate, setCaseCourtRegistrationDate] = useState("");
  const [casePowerOfAttorneyDate, setCasePowerOfAttorneyDate] = useState("");
  const [caseClosedDate, setCaseClosedDate] = useState("");
  const [showCaseDatesModal, setShowCaseDatesModal] = useState(false);
  const [caseTitle, setCaseTitle] = useState("");
  const [caseOpposingName, setCaseOpposingName] = useState("");
  const [caseClientRole, setCaseClientRole] = useState<ClientPartyRole>("خواهان");
  const [caseStage, setCaseStage] = useState<CaseStage>("بدوی");
  const [caseStages, setCaseStages] = useState<{
    stage1?: CaseStage;
    stage1ArchiveNumber?: string;
    stage2?: CaseStage;
    stage2ArchiveNumber?: string;
    stage3?: CaseStage;
    stage3ArchiveNumber?: string;
    stage4?: CaseStage;
    stage4ArchiveNumber?: string;
    stage5?: CaseStage;
    stage5ArchiveNumber?: string;
  }>({});
  const [showCaseStagesMenu, setShowCaseStagesMenu] = useState(false);
  const [caseBranch, setCaseBranch] = useState("");
  const [caseStatus, setCaseStatus] = useState<CaseStatus>("جریان دارد");
  const [caseDesc, setCaseDesc] = useState("");
  const [caseTotalContractAmount, setCaseTotalContractAmount] = useState("");
  const [caseDownPayment, setCaseDownPayment] = useState("");
  const [caseSanaPassword, setCaseSanaPassword] = useState("");
  const [caseContractNo, setCaseContractNo] = useState("");
  const [showCaseNumbersModal, setShowCaseNumbersModal] = useState(false);
  const [showAssociatedPersonsModal, setShowAssociatedPersonsModal] = useState(false);
  
  const [declarationTrackingCode, setDeclarationTrackingCode] = useState("");
  const [declarationSendDate, setDeclarationSendDate] = useState("");
  const [declarationSendGracePeriod, setDeclarationSendGracePeriod] = useState("");
  const [declarationReceiveDate, setDeclarationReceiveDate] = useState("");
  const [declarationReceiveGracePeriod, setDeclarationReceiveGracePeriod] = useState("");

  const [caseInstallments, setCaseInstallments] = useState<{ id?: string, amount: string, dueDate: string, isPaid?: boolean, paidDate?: string, note?: string }[]>([]);
  const [caseTempDocs, setCaseTempDocs] = useState<{name: string, dataUrl: string, type: string, size: string}[]>([]);
  const [casePayments, setCasePayments] = useState<{ id: string, title: string, amount: string, type: string, date: string, cardNumber: string, receiptImage?: string }[]>([]);
  const [caseAssociatedPersons, setCaseAssociatedPersons] = useState<{ name: string, phone: string }[]>([]);
  const [previewSubPage, setPreviewSubPage] = useState<number | null>(null);
  const [selectedReceiptImage, setSelectedReceiptImage] = useState<string | null>(null);
  const [docNameInput, setDocNameInput] = useState("");
  const [docTagInput, setDocTagInput] = useState<CaseDocument["tag"]>("عادی");
  const [docLawArticle, setDocLawArticle] = useState("");
  const [docLawText, setDocLawText] = useState("");
  const [docSearchQuery, setDocSearchQuery] = useState("");
  const [docTagFilter, setDocTagFilter] = useState<CaseDocument["tag"] | "all">("all");
  const [docTypeFilter, setDocTypeFilter] = useState<CaseDocument["type"] | "all">("all");
  const [docDateFrom, setDocDateFrom] = useState("");
  const [docDateTo, setDocDateTo] = useState("");

  const resetCaseFormStates = () => {
    setCaseFormStep(1);
    setCaseClientId("");
    setCaseNo("");
    setCourtCaseNo("");
    setCaseArchiveNo("");
    setAppealCaseNo("");
    setRejectionCaseNo("");
    setSupremeCaseNo("");
    setExecutionCaseNo("");
    setExecutionCivilCaseNo("");
    setInsolvencyCaseNo("");
    setInvestigationCaseNo("");
    setProsecutionCaseNo("");
    setCaseFilingDate("");
    setCaseCourtRegistrationDate("");
    setCasePowerOfAttorneyDate("");
    setCaseClosedDate("");
    setShowCaseDatesModal(false);
    setCaseTitle("");
    setCaseOpposingName("");
    setCaseClientRole("خواهان");
    setCaseStage("بدوی");
    setCaseStages({});
    setShowCaseStagesMenu(false);
    setCaseBranch("");
    setCaseStatus("جریان دارد");
    setCaseDesc("");
    setCaseTotalContractAmount("");
    setCaseDownPayment("");
    setCaseSanaPassword("");
    setCaseContractNo("");
    setCaseInstallments([]);
    setCasePayments([]);
    setCaseAssociatedPersons([]);
    setShowCaseNumbersModal(false);
    setShowAssociatedPersonsModal(false);
    setDeclarationTrackingCode("");
    setDeclarationSendDate("");
    setDeclarationSendGracePeriod("");
    setDeclarationReceiveDate("");
    setDeclarationReceiveGracePeriod("");
    setCaseTempDocs([]);
  };

  // --- Finance Edit States (inside modal detail) ---
  const [isEditingFinance, setIsEditingFinance] = useState(false);
  const [editFee, setEditFee] = useState("");
  const [editExpenses, setEditExpenses] = useState("");

  // Sync selected case finance state
  useEffect(() => {
    if (selectedCase) {
      setEditFee(selectedCase.receivedFee?.toString() || "0");
      setEditExpenses(selectedCase.paidExpenses?.toString() || "0");
      setIsEditingFinance(false);
    }
  }, [selectedCase]);

  // Cleanup selectedCase if it was deleted
  useEffect(() => {
    if (selectedCase && !cases.find(c => c.id === selectedCase.id)) {
      setSelectedCase(null);
    }
  }, [cases]);

  // --- New Note State (inside modal/sheet) ---
  const [noteTitle, setNoteTitle] = useState("");
  const [noteContent, setNoteContent] = useState("");

  // --- Note editing states ---
  const [editingNoteId, setEditingNoteId] = useState<string | null>(null);
  const [editNoteTitle, setEditNoteTitle] = useState("");
  const [editNoteContent, setEditNoteContent] = useState("");

  // --- Document Preview Overlay State ---
  const [previewDoc, setPreviewDoc] = useState<CaseDocument | null>(null);

  // --- Document Renaming states ---
  const [editingDocId, setEditingDocId] = useState<string | null>(null);
  const [editDocName, setEditDocName] = useState("");
  const [editDocTag, setEditDocTag] = useState<CaseDocument["tag"]>("عادی");
  const [editDocLawArticle, setEditDocLawArticle] = useState("");
  const [editDocLawText, setEditDocLawText] = useState("");

  // --- File attachment (inside modal) ---
  const [dragActive, setDragActive] = useState(false);

  // Handle Client creation/update
  const handleCreateClient = (e: React.FormEvent) => {
    e.preventDefault();
    if (!clientName.trim()) return;

    if (editingClient) {
        const updatedClient: Client = {
            ...editingClient,
            name: clientName,
            nationalId: toPersianDigits(clientNatId),
            phoneNumber: toPersianDigits(clientPhone),
            fatherName: clientFather,
            birthDate: clientBirthDate,
            address: clientAddress,
            description: clientDesc
        };
        onUpdateClient(updatedClient);
        setEditingClient(null);
    } else {
        const newClient: Client = {
            id: "cl_" + Date.now(),
            name: clientName,
            nationalId: toPersianDigits(clientNatId),
            phoneNumber: toPersianDigits(clientPhone),
            fatherName: clientFather,
            birthDate: clientBirthDate,
            address: clientAddress,
            description: clientDesc,
            createdAt: new Date().toLocaleDateString("fa-IR", { year: "numeric", month: "long", day: "numeric" })
        };
        onAddClient(newClient);
    }

    setShowClientForm(false);
    // Reset
    setClientName("");
    setClientNatId("");
    setClientPhone("");
    setClientFather("");
    setClientBirthDate("");
    setClientAddress("");
    setClientDesc("");
  };

  // Helper to parse Farsi/Arabic and formatted digits to number
  const parseDigits = (val: string) => {
    if (!val) return 0;
    const farsiDigits = [/۰/g, /۱/g, /۲/g, /۳/g, /۴/g, /۵/g, /۶/g, /۷/g, /۸/g, /۹/g];
    const arabicDigits = [/٠/g, /١/g, /٢/g, /٣/g, /٤/g, /٥/g, /٦/g, /٧/g, /٨/g, /٩/g];
    let clean = val;
    for (let i = 0; i < 10; i++) {
      clean = clean.replace(farsiDigits[i], i.toString()).replace(arabicDigits[i], i.toString());
    }
    clean = clean.replace(/[^\d.]/g, "");
    return parseFloat(clean) || 0;
  };

  const formatNumberWithSeparator = (val: string) => {
    const num = parseDigits(val);
    if (num === 0) return "";
    return num.toLocaleString('fa-IR');
  };

  // Handle Case creation
  const handleCreateCase = (e: React.FormEvent): boolean => {
    e.preventDefault();
    if (!caseTitle.trim()) {
      alert("لطفاً موضوع دعوی (خواسته) را وارد نمایید.");
      return false;
    }
    if (!caseClientId) {
      alert("لطفاً موکل مرتبط را انتخاب نمایید.");
      return false;
    }

    const client = clients.find(cl => cl.id === caseClientId);

    const totalContractAmountNum = parseDigits(caseTotalContractAmount);
    const downPaymentNum = parseDigits(caseDownPayment);
    const installmentsData = caseInstallments.map(ins => ({
      id: ins.id || "ins_" + Date.now() + Math.random(),
      amount: parseDigits(ins.amount),
      dueDate: ins.dueDate,
      isPaid: ins.isPaid,
      paidDate: ins.paidDate,
      note: ins.note || ""
    }));
    const paymentsData = casePayments.map(p => ({
      id: p.id, title: p.title, amount: parseDigits(p.amount), type: p.type, date: p.date, cardNumber: p.cardNumber, receiptImage: p.receiptImage
    }));
    const associatedPersonsData = caseAssociatedPersons;

    const newCase: LegalCase = {
      id: "ca_" + Date.now(),
      clientId: caseClientId,
      clientName: client?.name || "",
      clientRole: caseClientRole,
      category: selectedCaseCategory,
      opposingPartyName: caseOpposingName,
      caseNumber: toPersianDigits(caseNo),
      declarationTrackingCode: declarationTrackingCode ? toPersianDigits(declarationTrackingCode) : undefined,
      declarationSendDate: declarationSendDate ? toPersianDigits(declarationSendDate) : undefined,
      declarationSendGracePeriod: declarationSendGracePeriod ? toPersianDigits(declarationSendGracePeriod) : undefined,
      declarationReceiveDate: declarationReceiveDate ? toPersianDigits(declarationReceiveDate) : undefined,
      declarationReceiveGracePeriod: declarationReceiveGracePeriod ? toPersianDigits(declarationReceiveGracePeriod) : undefined,
      courtCaseNumber: courtCaseNo ? toPersianDigits(courtCaseNo) : undefined,
      archiveNumber: caseArchiveNo ? toPersianDigits(caseArchiveNo) : undefined,
      appealCaseNumber: appealCaseNo ? toPersianDigits(appealCaseNo) : undefined,
      rejectionCaseNumber: rejectionCaseNo ? toPersianDigits(rejectionCaseNo) : undefined,
      supremeCaseNumber: supremeCaseNo ? toPersianDigits(supremeCaseNo) : undefined,
      executionCaseNumber: executionCaseNo ? toPersianDigits(executionCaseNo) : undefined,
      executionCivilCaseNumber: executionCivilCaseNo ? toPersianDigits(executionCivilCaseNo) : undefined,
      insolvencyCaseNumber: insolvencyCaseNo ? toPersianDigits(insolvencyCaseNo) : undefined,
      investigationCaseNumber: investigationCaseNo ? toPersianDigits(investigationCaseNo) : undefined,
      prosecutionCaseNumber: prosecutionCaseNo ? toPersianDigits(prosecutionCaseNo) : undefined,
      filingDate: caseFilingDate ? toPersianDigits(caseFilingDate) : undefined,
      closedDate: caseClosedDate ? toPersianDigits(caseClosedDate) : undefined,
      courtRegistrationDate: caseCourtRegistrationDate ? toPersianDigits(caseCourtRegistrationDate) : undefined,
      powerOfAttorneyDate: casePowerOfAttorneyDate ? toPersianDigits(casePowerOfAttorneyDate) : undefined,
      title: caseTitle,
      stage: caseStage,
      stages: caseStages,
      branch: caseBranch,
      status: caseStatus,
      description: caseDesc,
      payments: paymentsData,
      totalContractAmount: totalContractAmountNum,
      downPayment: downPaymentNum,
      sanaPassword: caseSanaPassword,
      contractNumber: caseContractNo ? toPersianDigits(caseContractNo) : undefined,
      installments: installmentsData,
      associatedPersons: associatedPersonsData,
      createdAt: new Date().toLocaleDateString("fa-IR", { year: "numeric", month: "long", day: "numeric" })
    };

    onAddCase(newCase);
    
    caseTempDocs.forEach(td => {
      const newDoc: CaseDocument = {
        id: "doc_" + Date.now() + Math.random(),
        caseId: newCase.id,
        name: td.name,
        type: td.type as any,
        size: td.size,
        dataUrl: td.dataUrl,
        uploadedAt: new Date().toLocaleDateString("fa-IR", { year: "numeric", month: "long", day: "numeric" }),
        tag: "عادی"
      };
      if (td.dataUrl) {
        documentDb.set(newDoc.id, td.dataUrl);
      }
      onAddDocument(newDoc);
    });

    setShowCaseForm(false);
    // Reset
    setCaseClientId("");
    setCaseNo("");
    setCourtCaseNo("");
    setCaseArchiveNo("");
    setAppealCaseNo("");
    setRejectionCaseNo("");
    setSupremeCaseNo("");
    setExecutionCaseNo("");
    setExecutionCivilCaseNo("");
    setInsolvencyCaseNo("");
    setCaseTitle("");
    setCaseOpposingName("");
    setCaseClientRole("خواهان");
    setCaseStage("بدوی");
    setCaseStages({});
    setShowCaseStagesMenu(false);
    setCaseBranch("");
    setCaseStatus("جریان دارد");
    setCaseDesc("");
    setCaseTotalContractAmount("");
    setCaseDownPayment("");
    setCaseSanaPassword("");
    setCaseContractNo("");
    setCaseInstallments([]);
    return true;
  };

  // Handle addition of quick note inside Case modal
  const handleAddQuickNote = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedCase || !noteTitle.trim() || !noteContent.trim()) return;

    const newNote: CaseNote = {
      id: "no_" + Date.now(),
      caseId: selectedCase.id,
      title: noteTitle,
      content: noteContent,
      createdAt: new Date().toLocaleDateString("fa-IR", { year: "numeric", month: "long", day: "numeric" })
    };

    onAddNote(newNote);
    setNoteTitle("");
    setNoteContent("");
  };

  // Save edited note handler
  const handleSaveEditedNote = (noteId: string) => {
    if (!editNoteTitle.trim() || !editNoteContent.trim()) return;
    onUpdateNote(noteId, editNoteTitle, editNoteContent);
    setEditingNoteId(null);
  };

  const handleSaveEditedDoc = (docId: string) => {
    if (!editDocName.trim()) return;
    onUpdateDocument(docId, {
      name: editDocName,
      tag: editDocTag,
      lawArticle: editDocLawArticle,
      lawText: editDocLawText
    });
    setEditingDocId(null);
  };

  const triggerOpenInNewTab = (doc: CaseDocument) => {
    if (!doc) return;
    
    // We already have the loaded/prepared dataUrl (which is a Blob URL) in previewDoc
    const fileUrl = doc.dataUrl;
    if (!fileUrl) {
      alert("محتوای فایل هنوز بارگذاری نشده است. لطفاً کمی صبر کنید.");
      return;
    }

    try {
      // Try to open the blob URL or data URL directly in a new tab
      const newWindow = window.open(fileUrl, "_blank");
      if (!newWindow || newWindow.closed || typeof newWindow.closed === "undefined") {
        // Fallback if window.open was blocked by popup blocker or sandboxed iframe restriction
        const a = document.createElement("a");
        a.href = fileUrl;
        a.target = "_blank";
        a.rel = "noopener noreferrer";
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
      }
    } catch (e) {
      console.error("Failed to open document directly in new tab", e);
      // Fallback
      const a = document.createElement("a");
      a.href = fileUrl;
      a.target = "_blank";
      a.rel = "noopener noreferrer";
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
    }
  };

  const triggerDirectDownload = (dataUrl: string, name: string) => {
    if (!dataUrl) return;
    try {
      const a = document.createElement("a");
      a.href = dataUrl;
      a.download = name;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
    } catch (e) {
      console.error("Direct download failed", e);
      // Fallback to open in new tab with standard anchor
      const w = window.open();
      if (w) {
        w.document.write(`
          <html>
            <body style="background:#121212; color:#fff; display:flex; flex-direction:column; justify-content:center; align-items:center; height:100vh; font-family:sans-serif; margin:0;">
              <h2>در حال آماده‌سازی دانلود...</h2>
              <p>لطفاً برای دانلود مستقیم روی دکمه زیر کلیک کنید:</p>
              <a href="${dataUrl}" download="${name}" style="padding:12px 24px; background:#f59e0b; color:#000; text-decoration:none; font-weight:bold; border-radius:10px; font-size:16px;">کلیک کنید</a>
            </body>
          </html>
        `);
        w.document.close();
      }
    }
  };

  const handleViewDocument = async (doc: CaseDocument) => {
    try {
      let docUrl = doc.dataUrl;

      // Ensure we have the data URL
      if (!docUrl) {
        const storedUrl = await documentDb.get(doc.id);
        if (storedUrl) {
          docUrl = storedUrl;
        }
      }

      if (docUrl) {
        let finalUrl = docUrl;
        if (docUrl.startsWith("data:")) {
          try {
            const parts = docUrl.split(",");
            const mime = parts[0].match(/:(.*?);/)?.[1] || "application/octet-stream";
            const b64Data = parts[1];
            const byteCharacters = atob(b64Data);
            const byteArrays = [];
            
            for (let offset = 0; offset < byteCharacters.length; offset += 512) {
              const slice = byteCharacters.slice(offset, offset + 512);
              const byteNumbers = new Array(slice.length);
              for (let i = 0; i < slice.length; i++) {
                byteNumbers[i] = slice.charCodeAt(i);
              }
              const byteArray = new Uint8Array(byteNumbers);
              byteArrays.push(byteArray);
            }
            
            const blob = new Blob(byteArrays, { type: mime });
            finalUrl = URL.createObjectURL(blob);
          } catch (e) {
            console.error("Error converting data URI to blob URL:", e);
            finalUrl = docUrl;
          }
        }
        setPreviewDoc({ ...doc, dataUrl: finalUrl });
      } else {
        setPreviewDoc(doc); // Open anyway to show error view
      }
    } catch (err: any) {
      console.error("Error preparing document for preview:", err);
      setPreviewDoc(doc);
    }
  };

  // Ensure object URLs are cleaned up when modal closes
  const closePreview = () => {
    if (previewDoc?.dataUrl && previewDoc.dataUrl.startsWith("blob:")) {
      URL.revokeObjectURL(previewDoc.dataUrl);
    }
    setPreviewDoc(null);
  };

  // Handle file uploads (converts images under 1MB to Base64 instantly for offline previewing)
  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!selectedCase || !files || files.length === 0) return;

    const file = files[0];
    const isImage = file.type.startsWith("image/");
    const isPdf = file.type === "application/pdf" || file.name.toLowerCase().endsWith(".pdf");
    const isAudio = file.type.startsWith("audio/");
    const sizeStr = (file.size / (1024 * 1024)).toFixed(1) + " مگابایت";

    const createDocItem = (dataUrl?: string) => {
      const newDoc: CaseDocument = {
        id: "do_" + Date.now(),
        caseId: selectedCase.id,
        name: docNameInput || file.name,
        type: isPdf ? "pdf" : isImage ? "image" : isAudio ? "audio" : "other",
        size: toPersianDigits(sizeStr),
        dataUrl,
        uploadedAt: new Date().toLocaleDateString("fa-IR", { year: "numeric", month: "long", day: "numeric" }),
        tag: docTagInput || "عادی",
        lawArticle: docLawArticle,
        lawText: docLawText
      };
      onAddDocument(newDoc);
      setDocNameInput("");
      setDocTagInput("عادی");
      setDocLawArticle("");
      setDocLawText("");
    };

    if (file.size < 20971520) { // 20 MB max
      // Convert to Base64 (both images and PDFs can be converted to dataUrls)
      const reader = new FileReader();
      reader.onload = (event) => {
        createDocItem(event.target?.result as string);
      };
      reader.readAsDataURL(file);
    } else {
      createDocItem();
    }
  };

  // Drag over handler for documents
  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true);
    } else if (e.type === "dragleave") {
      setDragActive(false);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);

    if (!selectedCase || !e.dataTransfer.files || e.dataTransfer.files.length === 0) return;

    const file = e.dataTransfer.files[0];
    const isImage = file.type.startsWith("image/");
    const isPdf = file.type === "application/pdf" || file.name.toLowerCase().endsWith(".pdf");
    const sizeStr = (file.size / (1024 * 1024)).toFixed(1) + " مگابایت";

    const createDocItem = (dataUrl?: string) => {
      const newDoc: CaseDocument = {
        id: "do_" + Date.now(),
        caseId: selectedCase.id,
        name: docNameInput || file.name,
        type: isPdf ? "pdf" : isImage ? "image" : "other",
        size: toPersianDigits(sizeStr),
        dataUrl,
        uploadedAt: new Date().toLocaleDateString("fa-IR", { year: "numeric", month: "long", day: "numeric" }),
        tag: docTagInput || "عادی",
        lawArticle: docLawArticle,
        lawText: docLawText
      };
      onAddDocument(newDoc);
      setDocNameInput("");
      setDocTagInput("عادی");
      setDocLawArticle("");
      setDocLawText("");
    };

    if (file.size < 20971520) { // 20 MB max
      const reader = new FileReader();
      reader.onload = (event) => {
        createDocItem(event.target?.result as string);
      };
      reader.readAsDataURL(file);
    } else {
      createDocItem();
    }
  };

  // Get notes/documents for specifically selected case
  const activeCaseNotes = selectedCase ? notes.filter(n => n.caseId === selectedCase.id) : [];
  const activeCaseDocs = selectedCase ? documents.filter(d => d.caseId === selectedCase.id) : [];
  const filteredCaseDocs = activeCaseDocs.filter(doc => {
    const q = docSearchQuery.trim().toLowerCase();
    const matchesSearch = q === "" || 
      doc.name.toLowerCase().includes(q) || 
      (doc.textContent && doc.textContent.toLowerCase().includes(q)) ||
      (doc.lawArticle && doc.lawArticle.toLowerCase().includes(q)) ||
      (doc.lawText && doc.lawText.toLowerCase().includes(q));

    const matchesTag = docTagFilter === "all" || doc.tag === docTagFilter;
    const matchesType = docTypeFilter === "all" || doc.type === docTypeFilter;
    
    let matchesDate = true;
    if (docDateFrom) matchesDate = matchesDate && doc.uploadedAt >= docDateFrom;
    if (docDateTo) matchesDate = matchesDate && doc.uploadedAt <= docDateTo;

    return matchesSearch && matchesTag && matchesType && matchesDate;
  });

  const handlePrint = (caseToPrint?: LegalCase, includeFinancial: boolean = true, fullReport: boolean = false) => {
    const caseObj = caseToPrint || selectedCase;
    if (!caseObj) return;
    const associatedClient = clients.find(cl => cl.id === caseObj.clientId);

    const clientName = associatedClient?.name || caseObj.clientName;
    const clientRole = caseObj.clientRole;
    const clientPhone = associatedClient?.phoneNumber;
    const clientNationalId = associatedClient?.nationalId;
    const clientBirthDate = associatedClient?.birthDate;

    // Filter notes, documents and events for full report
    const caseNotes = notes.filter(n => n.caseId === caseObj.id);
    const caseDocs = documents.filter(d => d.caseId === caseObj.id);
    const caseEvents = events.filter(e => e.caseId === caseObj.id);

    let printWindow: Window | null = null;
    try {
      printWindow = window.open("", "_blank");
    } catch (e) {
      console.warn("window.open blocked:", e);
    }

    let doc: Document | null = null;
    let iframe: HTMLIFrameElement | null = null;

    if (printWindow) {
      doc = printWindow.document;
    } else {
      iframe = document.createElement("iframe");
      iframe.style.position = "fixed";
      iframe.style.right = "0";
      iframe.style.bottom = "0";
      iframe.style.width = "0";
      iframe.style.height = "0";
      iframe.style.border = "0";
      document.body.appendChild(iframe);
      doc = iframe.contentWindow?.document || iframe.contentDocument || null;
    }

    if (doc) {
      doc.open();
      doc.write(`
        <!DOCTYPE html>
        <html lang="fa" dir="rtl">
          <head>
            <meta charset="UTF-8">
            <title>برگه پرونده - ${caseObj.title}</title>
            <link href="https://cdn.jsdelivr.net/npm/tailwindcss@2.2.19/dist/tailwind.min.css" rel="stylesheet">
            <style>
              @import url('https://fonts.googleapis.com/css2?family=Vazirmatn:wght@400;500;700&display=swap');
              body {
                font-family: 'Vazirmatn', 'Tahoma', sans-serif;
                background-color: white !important;
                color: black !important;
                padding: 40px;
                line-height: 1.6;
              }
              @media print {
                body {
                  padding: 10px;
                }
                .no-print {
                  display: none !important;
                }
              }
            </style>
          </head>
          <body class="p-8">
            <div class="flex items-center justify-between border-b-2 border-slate-900 pb-4 mb-6">
              <div class="flex items-center gap-3">
                <div class="text-right">
                  <h1 class="text-lg font-black text-slate-900">دفتر وکالت ${lawyerName || "وکیل"}</h1>
                  <p class="text-xs text-slate-600 font-bold mt-1">وکیل پایه یک دادگستری و مشاور حقوقی</p>
                </div>
              </div>
              <div class="text-center font-bold">
                <h2 class="text-md font-extrabold text-slate-800">${fullReport ? "گزارش آرشیو جامع و کامل پرونده قضایی" : "برگ خلاصه وضعیت و سابقه پرونده قضایی"}</h2>
              </div>
            </div>

            <div class="text-[10px] text-slate-400 mb-4 text-left font-mono">
              تاریخ گزارش‌گیری: ${toPersianDigits(getCurrentJalali().jy + "/" + getCurrentJalali().jm + "/" + getCurrentJalali().jd)}
            </div>

            <!-- Client Section -->
            <div class="mb-6">
              <h3 class="text-xs font-black text-slate-900 mb-2 border-r-4 border-amber-500 pr-2 pb-0.5">۱. مشخصات هویتی موکل</h3>
              <div class="grid grid-cols-2 gap-4 border border-slate-300 p-4 rounded-xl text-xs bg-slate-50/10">
                ${hasValue(clientName) ? `<p><strong>نام موکل:</strong> <span style="color: #1e40af; font-weight: 600;">${clientName}</span></p>` : ""}
                ${hasValue(clientRole) ? `<p><strong>نقش موکل:</strong> <span style="color: #1e40af; font-weight: 600;">${clientRole}</span></p>` : ""}
                ${hasValue(clientPhone) ? `<p><strong>تلفن همراه:</strong> <span style="color: #1e40af; font-weight: 600; font-family: monospace;">${toPersianDigits(clientPhone)}</span></p>` : ""}
                ${hasValue(clientNationalId) ? `<p><strong>کد ملی:</strong> <span style="color: #1e40af; font-weight: 600; font-family: monospace;">${toPersianDigits(clientNationalId)}</span></p>` : ""}
                ${hasValue(clientBirthDate) ? `<p><strong>تاریخ تولد:</strong> <span style="color: #1e40af; font-weight: 600; font-family: monospace;">${toPersianDigits(clientBirthDate)}</span></p>` : ""}
              </div>
            </div>

            <!-- Case Section -->
            <div class="mb-6">
              <h3 class="text-xs font-black text-slate-900 mb-2 border-r-4 border-amber-500 pr-2 pb-0.5">۲. اطلاعات پرونده</h3>
              <div class="grid grid-cols-2 gap-4 border border-slate-300 p-4 rounded-xl text-xs bg-slate-50/10">
                ${hasValue(caseObj.title) ? `<p><strong>موضوع پرونده (خواسته):</strong> <span style="color: #1e40af; font-weight: 600;">${toPersianDigits(caseObj.title)}</span></p>` : ""}
                ${hasValue(caseObj.caseNumber) ? `<p><strong>${caseObj.category === 'اظهارنامه' ? 'شماره اظهارنامه' : 'شماره پرونده (ثنا)'}:</strong> <span style="color: #1e40af; font-weight: 600; font-family: monospace;">${toPersianDigits(caseObj.caseNumber)}</span></p>` : ""}
                ${hasValue(caseObj.declarationTrackingCode) ? `<p><strong>کد رهگیری اظهارنامه:</strong> <span style="color: #1e40af; font-weight: 600; font-family: monospace;">${toPersianDigits(caseObj.declarationTrackingCode)}</span></p>` : ""}
                ${hasValue(caseObj.declarationSendDate) ? `<p><strong>تاریخ ارسال اظهارنامه:</strong> <span style="color: #1e40af; font-weight: 600; font-family: monospace;">${toPersianDigits(caseObj.declarationSendDate)}</span> ${caseObj.declarationSendGracePeriod ? `<span style="color: #d97706; font-weight: bold;">(${toPersianDigits(caseObj.declarationSendGracePeriod)} روز مهلت)</span>` : ""}</p>` : ""}
                ${hasValue(caseObj.declarationReceiveDate) ? `<p><strong>تاریخ دریافت اظهارنامه:</strong> <span style="color: #1e40af; font-weight: 600; font-family: monospace;">${toPersianDigits(caseObj.declarationReceiveDate)}</span> ${caseObj.declarationReceiveGracePeriod ? `<span style="color: #d97706; font-weight: bold;">(${toPersianDigits(caseObj.declarationReceiveGracePeriod)} روز مهلت)</span>` : ""}</p>` : ""}
                ${hasValue(caseObj.branch) ? `<p><strong>شعبه دادگاه:</strong> <span style="color: #1e40af; font-weight: 600;">${toPersianDigits(caseObj.branch)}</span></p>` : ""}
                ${hasValue(caseObj.sanaPassword) ? `<p><strong>رمز شخصی ثنا:</strong> <span style="color: #1e40af; font-weight: 600; font-family: monospace;">${caseObj.sanaPassword}</span></p>` : ""}
                ${hasValue(caseObj.contractNumber) ? `<p><strong>شماره قرارداد وکالتنامه:</strong> <span style="color: #1e40af; font-weight: 600; font-family: monospace;">${toPersianDigits(caseObj.contractNumber)}</span></p>` : ""}
                ${hasValue(caseObj.opposingPartyName) ? `<p><strong>طرف مقابل پرونده:</strong> <span style="color: #1e40af; font-weight: 600;">${caseObj.opposingPartyName}</span></p>` : ""}
                ${hasValue(caseObj.filingDate) ? `<p><strong>تاریخ تشکیل در سامانه:</strong> <span style="color: #1e40af; font-weight: 600; font-family: monospace;">${toPersianDigits(caseObj.filingDate)}</span></p>` : ""}
                ${hasValue(caseObj.courtRegistrationDate) ? `<p><strong>تاریخ ثبت دادگستری:</strong> <span style="color: #1e40af; font-weight: 600; font-family: monospace;">${toPersianDigits(caseObj.courtRegistrationDate)}</span></p>` : ""}
                ${hasValue(caseObj.powerOfAttorneyDate) ? `<p><strong>تاریخ اخذ وکالت:</strong> <span style="color: #1e40af; font-weight: 600; font-family: monospace;">${toPersianDigits(caseObj.powerOfAttorneyDate)}</span></p>` : ""}
                ${hasValue(caseObj.closedDate) ? `<p><strong>تاریخ مختومه شدن:</strong> <span style="color: #1e40af; font-weight: 600; font-family: monospace;">${toPersianDigits(caseObj.closedDate)}</span></p>` : ""}
                ${hasValue(caseObj.createdAt) ? `<p><strong>تاریخ ثبت در سیستم:</strong> <span style="color: #1e40af; font-weight: 600; font-family: monospace;">${toPersianDigits(caseObj.createdAt)}</span></p>` : ""}
                ${hasValue(caseObj.stage) ? `<p><strong>مرحلۀ پرونده:</strong> <span style="color: #1e40af; font-weight: 600;">${caseObj.stage}</span></p>` : ""}
                ${hasValue(caseObj.status) ? `<p><strong>وضعیت پرونده:</strong> <span style="color: #1e40af; font-weight: 600;">${caseObj.status}</span></p>` : ""}
                ${hasValue(caseObj.courtCaseNumber) ? `<p><strong>شماره دادگاه بدوی:</strong> <span style="color: #1e40af; font-weight: 600; font-family: monospace;">${toPersianDigits(caseObj.courtCaseNumber)}</span></p>` : ""}
                ${hasValue(caseObj.archiveNumber) ? `<p><strong>کلاسه بایگانی دفتر:</strong> <span style="color: #1e40af; font-weight: 600; font-family: monospace;">${toPersianDigits(caseObj.archiveNumber)}</span></p>` : ""}
                ${hasValue(caseObj.appealCaseNumber) ? `<p><strong>شماره تجدید نظر:</strong> <span style="color: #1e40af; font-weight: 600; font-family: monospace;">${toPersianDigits(caseObj.appealCaseNumber)}</span></p>` : ""}
                ${hasValue(caseObj.rejectionCaseNumber) ? `<p><strong>شماره واخواهی:</strong> <span style="color: #1e40af; font-weight: 600; font-family: monospace;">${toPersianDigits(caseObj.rejectionCaseNumber)}</span></p>` : ""}
                ${hasValue(caseObj.supremeCaseNumber) ? `<p><strong>فرجام خواهی/دیوان:</strong> <span style="color: #1e40af; font-weight: 600; font-family: monospace;">${toPersianDigits(caseObj.supremeCaseNumber)}</span></p>` : ""}
                ${hasValue(caseObj.executionCaseNumber) ? `<p><strong>اجرای احکام کیفری:</strong> <span style="color: #1e40af; font-weight: 600; font-family: monospace;">${toPersianDigits(caseObj.executionCaseNumber)}</span></p>` : ""}
                ${hasValue(caseObj.executionCivilCaseNumber) ? `<p><strong>اجرای احکام مدنی:</strong> <span style="color: #1e40af; font-weight: 600; font-family: monospace;">${toPersianDigits(caseObj.executionCivilCaseNumber)}</span></p>` : ""}
                ${hasValue(caseObj.insolvencyCaseNumber) ? `<p><strong>شماره پرونده اعسار:</strong> <span style="color: #1e40af; font-weight: 600; font-family: monospace;">${toPersianDigits(caseObj.insolvencyCaseNumber)}</span></p>` : ""}
                ${hasValue(caseObj.investigationCaseNumber) ? `<p><strong>شماره پرونده بازپرسی:</strong> <span style="color: #1e40af; font-weight: 600; font-family: monospace;">${toPersianDigits(caseObj.investigationCaseNumber)}</span></p>` : ""}
                ${hasValue(caseObj.prosecutionCaseNumber) ? `<p><strong>شماره پرونده دادیاری:</strong> <span style="color: #1e40af; font-weight: 600; font-family: monospace;">${toPersianDigits(caseObj.prosecutionCaseNumber)}</span></p>` : ""}
              </div>
            </div>

            <!-- Notes Section (Full Report) -->
            ${fullReport && caseNotes.length > 0 ? `
            <div class="mb-6">
              <h3 class="text-xs font-black text-slate-900 mb-2 border-r-4 border-amber-500 pr-2 pb-0.5">۳. یادداشت‌ها و وقایع‌نگاری</h3>
              <div class="space-y-3">
                ${caseNotes.map(n => `
                  <div class="p-3 border border-slate-200 rounded-xl bg-slate-50/10 text-xs">
                    <div class="flex justify-between items-center border-b border-slate-100 pb-2 mb-2">
                      <span class="font-black text-slate-800">${n.title}</span>
                      <span class="text-[10px] text-slate-400 font-mono">${toPersianDigits(n.createdAt)}</span>
                    </div>
                    <div class="text-slate-600 leading-relaxed whitespace-pre-wrap">${n.content}</div>
                  </div>
                `).join("")}
              </div>
            </div>
            ` : ""}

            <!-- Events Section (Full Report) -->
            ${fullReport && caseEvents.length > 0 ? `
            <div class="mb-6">
              <h3 class="text-xs font-black text-slate-900 mb-2 border-r-4 border-amber-500 pr-2 pb-0.5">${fullReport ? "۴" : "۳"}. رویدادها و جلسات ثبت شده</h3>
              <div class="space-y-3">
                ${caseEvents.map(e => `
                  <div class="p-3 border border-slate-200 rounded-xl bg-slate-50/10 text-xs">
                    <div class="flex justify-between items-center mb-1">
                      <span class="font-black text-blue-700">${e.title} (${e.type})</span>
                      <span class="text-[10px] text-slate-500 font-mono">${toPersianDigits(e.jalaliDate)} - ${toPersianDigits(e.time)}</span>
                    </div>
                    ${e.description ? `<div class="text-slate-600 text-[10px] leading-relaxed mt-1">${e.description}</div>` : ""}
                  </div>
                `).join("")}
              </div>
            </div>
            ` : ""}

            <!-- Documents Section (Full Report) -->
            ${fullReport && caseDocs.length > 0 ? `
            <div class="mb-6">
              <h3 class="text-xs font-black text-slate-900 mb-2 border-r-4 border-amber-500 pr-2 pb-0.5">${fullReport ? "۵" : "۳"}. اسناد و پیوست‌های پرونده</h3>
              <div class="grid grid-cols-2 gap-2">
                ${caseDocs.map(d => `
                  <div class="p-2 border border-slate-200 rounded-lg text-[10px] flex justify-between items-center">
                    <span class="text-slate-700 font-bold">${d.name}</span>
                    <div class="flex gap-2 text-slate-400">
                      <span>${d.tag || "عادی"}</span>
                      <span class="font-mono">${toPersianDigits(d.uploadedAt)}</span>
                    </div>
                  </div>
                `).join("")}
              </div>
            </div>
            ` : ""}

            <!-- Financial Section -->
            ${(includeFinancial && (hasValue(caseObj.totalContractAmount) || hasValue(caseObj.downPayment) || hasValue(caseObj.receivedFee) || hasValue(caseObj.paidExpenses) || (caseObj.installments && caseObj.installments.length > 0) || (caseObj.payments && caseObj.payments.length > 0))) ? `
            <div class="mb-6">
              <h3 class="text-xs font-black text-slate-900 mb-2 border-r-4 border-amber-500 pr-2 pb-0.5">${fullReport ? "۶" : "۳"}. وضعیت مالی و قرارداد</h3>
              <div class="grid grid-cols-2 gap-4 border border-slate-300 p-4 rounded-xl text-xs bg-slate-50/10">
                ${hasValue(caseObj.totalContractAmount) ? `<p><strong>کل مبلغ قرارداد:</strong> <span style="color: #1e40af; font-weight: 600;">${toPersianDigits((caseObj.totalContractAmount ?? 0).toLocaleString())} تومان</span></p>` : ""}
                ${hasValue(caseObj.downPayment) ? `<p><strong>پیش‌پرداخت:</strong> <span style="color: #1e40af; font-weight: 600;">${toPersianDigits((caseObj.downPayment ?? 0).toLocaleString())} تومان</span></p>` : ""}
                ${hasValue(caseObj.receivedFee) ? `<p><strong>حق‌الوکاله دریافتی:</strong> <span style="color: #1e40af; font-weight: 600;">${toPersianDigits((caseObj.receivedFee ?? 0).toLocaleString())} تومان</span></p>` : ""}
                ${hasValue(caseObj.paidExpenses) ? `<p><strong>هزینه‌های انجام شده:</strong> <span style="color: #1e40af; font-weight: 600;">${toPersianDigits((caseObj.paidExpenses ?? 0).toLocaleString())} تومان</span></p>` : ""}
              </div>
              
              ${caseObj.installments && caseObj.installments.length > 0 ? `
              <div class="mt-3 border border-slate-350 rounded-xl overflow-hidden mb-4">
                <div class="bg-slate-100 px-3 py-1.5 border-b border-slate-350">
                  <h4 class="text-[10px] font-black text-slate-800">جدول اقساط حق‌الوکاله:</h4>
                </div>
                <table class="w-full border-collapse text-xs text-right" dir="rtl">
                  <thead>
                    <tr class="bg-slate-50 font-bold border-b border-slate-350 text-slate-600">
                      <th class="p-2 border-l border-slate-350 text-center w-12" style="background:#f1f5f9;">ردیف</th>
                      <th class="p-2 border-l border-slate-350" style="background:#f1f5f9;">مبلغ قسط</th>
                      <th class="p-2 border-l border-slate-350" style="background:#f1f5f9;">تاریخ سررسید</th>
                      <th class="p-2 border-l border-slate-350" style="background:#f1f5f9;">بابت / توضیحات</th>
                      <th class="p-2" style="background:#f1f5f9;">وضعیت پرداخت</th>
                    </tr>
                  </thead>
                  <tbody>
                    ${caseObj.installments.map((ins, idx) => `
                      <tr class="border-b border-slate-200 last:border-0">
                        <td class="p-2 border-l border-slate-200 text-center font-mono text-[10px]">${toPersianDigits(idx + 1)}</td>
                        <td class="p-2 border-l border-slate-200" style="color: #1e40af; font-weight: 600;">${toPersianDigits((ins.amount ?? 0).toLocaleString())} تومان</td>
                        <td class="p-2 border-l border-slate-200 font-mono">${toPersianDigits(ins.dueDate)}</td>
                        <td class="p-2 border-l border-slate-200" style="font-family: sans-serif;">${ins.note || "-"}</td>
                        <td class="p-2">
                          ${ins.isPaid ? `<span style="color: #16a34a; font-weight: bold;">پرداخت شده ${ins.paidDate ? `(در ` + toPersianDigits(ins.paidDate) + `)` : ``}</span>` : `<span style="color: #d97706; font-weight: bold;">معوق / در انتظار پرداخت</span>`}
                        </td>
                      </tr>
                    `).join("")}
                  </tbody>
                </table>
              </div>
              ` : ""}

              ${caseObj.payments && caseObj.payments.length > 0 ? `
              <div class="mt-3 border border-slate-350 rounded-xl overflow-hidden mb-4">
                <div class="bg-slate-100 px-3 py-1.5 border-b border-slate-350">
                  <h4 class="text-[10px] font-black text-slate-800">تراکنش‌ها و وجوه دریافتی:</h4>
                </div>
                <table class="w-full border-collapse text-xs text-right" dir="rtl">
                  <thead>
                    <tr class="bg-slate-50 font-bold border-b border-slate-350 text-slate-600">
                      <th class="p-2 border-l border-slate-350 text-center w-12" style="background:#f1f5f9;">ردیف</th>
                      <th class="p-2 border-l border-slate-350" style="background:#f1f5f9;">بابت / شرح</th>
                      <th class="p-2 border-l border-slate-350" style="background:#f1f5f9;">مبلغ دریافتی</th>
                      <th class="p-2 border-l border-slate-350" style="background:#f1f5f9;">نوع پرداخت</th>
                      <th class="p-2" style="background:#f1f5f9;">تاریخ پرداخت</th>
                    </tr>
                  </thead>
                  <tbody>
                    ${caseObj.payments.map((p, idx) => `
                      <tr class="border-b border-slate-200 last:border-0">
                        <td class="p-2 border-l border-slate-200 text-center font-mono text-[10px]">${toPersianDigits(idx + 1)}</td>
                        <td class="p-2 border-l border-slate-200" style="color: #334155;">${p.title}</td>
                        <td class="p-2 border-l border-slate-200" style="color: #16a34a; font-weight: 600;">${toPersianDigits((p.amount ?? 0).toLocaleString())} تومان</td>
                        <td class="p-2 border-l border-slate-200" style="color: #475569;">${p.type}</td>
                        <td class="p-2 font-mono">${toPersianDigits(p.date)}</td>
                      </tr>
                    `).join("")}
                  </tbody>
                </table>
              </div>
              ` : ""}
            </div>
            ` : ""}

            <!-- Associated Persons Section -->
            ${caseObj.associatedPersons && caseObj.associatedPersons.length > 0 ? `
            <div class="mb-6">
              <h3 class="text-xs font-black text-slate-900 mb-2 border-r-4 border-amber-500 pr-2 pb-0.5">۴. افراد مرتبط با پرونده</h3>
              <table class="w-full border-collapse border border-slate-350 text-xs text-right" dir="rtl">
                <thead>
                  <tr class="bg-slate-100 font-bold border-b border-slate-350">
                    <th class="border border-slate-350 p-2 text-right">نام و نام خانوادگی</th>
                    <th class="border border-slate-350 p-2 text-right">شماره تماس (تلفن همراه)</th>
                  </tr>
                </thead>
                <tbody>
                  ${caseObj.associatedPersons.map(person => `
                    <tr>
                      <td class="border border-slate-350 p-2" style="color: #1e40af; font-weight: 600;">${person.name || "-"}</td>
                      <td class="border border-slate-350 p-2 font-mono" style="color: #1e40af; font-weight: bold;">${person.phone ? toPersianDigits(person.phone) : "-"}</td>
                    </tr>
                  `).join("")}
                </tbody>
              </table>
            </div>
            ` : ""}

            <!-- Description -->
            ${hasValue(caseObj.description) ? `
            <div class="mb-6">
              <h3 class="text-xs font-black text-slate-900 mb-2 border-r-4 border-amber-500 pr-2 pb-0.5">۵. شرح خلاصه و مبانی وضعیت پرونده</h3>
              <div class="border border-slate-300 p-3 text-xs bg-slate-50/20 whitespace-pre-line" style="color: #1e40af; font-weight: 500;">${toPersianDigits(caseObj.description)}</div>
            </div>
            ` : ""}

            <!-- Signatures Section -->
            <div class="mt-12 pt-8 flex justify-between items-start text-[10px] border-t border-slate-100">
              <div class="space-y-1">
                <span class="text-slate-500 font-bold block">سامانه مدیریت مراجعین دفتر وکالت ${lawyerName || "وکیل"}</span>
                <span class="text-slate-400 block">شماره‌های تماس: ۰۹۱۴۴۶۲۷۱۱۹ - ۰۹۹۰۱۰۹۵۳۹۳</span>
              </div>
              <div class="text-center pl-16 space-y-3">
                <p class="font-bold text-slate-800">صحت مندرجات مورد تایید است</p>
                <p class="text-[11px] text-amber-600 font-extrabold pb-12">امضا و مهر رسمی وکیل ${lawyerName || "مسئول پرونده"}</p>
              </div>
            </div>

            <script>
              function runPrint() {
                window.focus();
                window.print();
              }
              if (document.readyState === "complete" || document.readyState === "interactive") {
                setTimeout(runPrint, 300);
              } else {
                window.onload = function() {
                  setTimeout(runPrint, 300);
                };
              }
            </script>
          </body>
        </html>
      `);
      doc.close();

      setTimeout(() => {
        try {
          if (printWindow) {
            printWindow.focus();
            printWindow.print();
          } else if (iframe) {
            iframe.contentWindow?.focus();
            iframe.contentWindow?.print();
          }
        } catch (e) {
          console.warn("Direct print trigger blocked:", e);
          if (!printWindow) {
            window.print();
          }
        }
        if (iframe) {
          setTimeout(() => {
            try {
              document.body.removeChild(iframe!);
            } catch (err) {}
          }, 10000);
        }
      }, 500);
    }
  };

  const handlePrintClient = (clientToPrint: Client) => {
    if (!clientToPrint) return;

    let printWindow: Window | null = null;
    try {
      printWindow = window.open("", "_blank");
    } catch (e) {
      console.warn("window.open blocked:", e);
    }

    let doc: Document | null = null;
    let iframe: HTMLIFrameElement | null = null;

    if (printWindow) {
      doc = printWindow.document;
    } else {
      iframe = document.createElement("iframe");
      iframe.style.position = "fixed";
      iframe.style.right = "0";
      iframe.style.bottom = "0";
      iframe.style.width = "0";
      iframe.style.height = "0";
      iframe.style.border = "0";
      document.body.appendChild(iframe);
      doc = iframe.contentWindow?.document || iframe.contentDocument || null;
    }

    if (doc) {
      doc.open();
      doc.write(`
        <!DOCTYPE html>
        <html lang="fa" dir="rtl">
          <head>
            <meta charset="UTF-8">
            <title>پروفایل موکل - ${clientToPrint.name}</title>
            <link href="https://cdn.jsdelivr.net/npm/tailwindcss@2.2.19/dist/tailwind.min.css" rel="stylesheet">
            <style>
              @import url('https://fonts.googleapis.com/css2?family=Vazirmatn:wght@400;500;700&display=swap');
              body {
                font-family: 'Vazirmatn', 'Tahoma', sans-serif;
                background-color: white !important;
                color: black !important;
                padding: 40px;
                line-height: 1.6;
              }
              @media print {
                body {
                  padding: 10px;
                }
                .no-print {
                  display: none !important;
                }
              }
            </style>
          </head>
          <body class="p-8">
            <div class="flex items-center justify-between border-b-2 border-slate-900 pb-4 mb-6">
              <div class="flex items-center gap-3">
                <div class="text-right">
                  <h1 class="text-lg font-black text-slate-900">دفتر وکالت ${lawyerName || "وکیل"}</h1>
                  <p class="text-xs text-slate-600 font-bold mt-1">وکیل پایه یک دادگستری و مشاور حقوقی</p>
                </div>
              </div>
              <div class="text-center font-bold">
                <h2 class="text-md font-extrabold text-slate-800">برگ شناسنامه و خلاصه مشخصات موکل</h2>
              </div>
            </div>

            <!-- Client Section -->
            <div class="mb-6">
              <h3 class="text-xs font-black text-slate-900 mb-2 border-r-4 border-amber-500 pr-2 pb-0.5">مشخصات هویتی و ثبتی موکل</h3>
              <table class="w-full border-collapse border border-slate-350 text-xs text-right" dir="rtl">
                <tbody>
                  <tr>
                    <td class="border border-slate-350 p-2.5 font-bold bg-slate-50 w-1/4">نام و نام خانوادگی:</td>
                    <td class="border border-slate-350 p-2.5 w-1/4">${clientToPrint.name}</td>
                    <td class="border border-slate-350 p-2.5 font-bold bg-slate-50 w-1/4">کد ملی / شناسه ملی:</td>
                    <td class="border border-slate-350 p-2.5 w-1/4 font-mono">${toPersianDigits(clientToPrint.nationalId)}</td>
                  </tr>
                  <tr>
                    <td class="border border-slate-350 p-2.5 font-bold bg-slate-50">نام پدر:</td>
                    <td class="border border-slate-350 p-2.5">${clientToPrint.fatherName || "-"}</td>
                    <td class="border border-slate-350 p-2.5 font-bold bg-slate-50">تاریخ تولد:</td>
                    <td class="border border-slate-350 p-2.5 font-mono">${clientToPrint.birthDate ? toPersianDigits(clientToPrint.birthDate) : "-"}</td>
                  </tr>
                </tbody>
              </table>
            </div>

            <!-- Focus Content: Detailed Contact and Location Section -->
            <div class="mb-6">
              <h3 class="text-xs font-black text-slate-900 mb-2 border-r-4 border-amber-500 pr-2 pb-0.5">اطلاعات تماس، ارتباطات و نشانی قانونی اقامتگاه موکل</h3>
              <table class="w-full border-collapse border border-slate-350 text-xs text-right" dir="rtl">
                <tbody>
                  <tr>
                    <td class="border border-slate-350 p-2.5 font-bold bg-slate-50 w-1/4">تلفن همراه ثنا:</td>
                    <td class="border border-slate-350 p-2.5 font-mono text-amber-700 font-bold">${toPersianDigits(clientToPrint.phoneNumber)}</td>
                    <td class="border border-slate-350 p-2.5 font-bold bg-slate-50 w-1/4">یادداشت اداری / صنف:</td>
                    <td class="border border-slate-350 p-2.5">${toPersianDigits(clientToPrint.description || "-")}</td>
                  </tr>
                  <tr>
                    <td class="border border-slate-350 p-2.5 font-bold bg-slate-50">نشانی کامل پستی اقامتگاه:</td>
                    <td class="border border-slate-350 p-2.5" colspan="3">${toPersianDigits(clientToPrint.address || "-")}</td>
                  </tr>
                </tbody>
              </table>
            </div>

            <div class="mt-12 text-[10px] text-slate-400 text-center border-t pt-4">
              سامانه اتوماسیون وکالت ${lawyerName || "وکیل"} - شماره‌های تماس: ۰۹۱۴۴۶۲۷۱۱۹ - ۰۹۹۰۱۰۹۵۳۹۳
              <br/>
              تاریخ خلاصه وضعیت موکل: ${toPersianDigits(new Date().toLocaleDateString("fa-IR"))}
            </div>

            <script>
              function runPrint() {
                window.focus();
                window.print();
              }
              if (document.readyState === "complete" || document.readyState === "interactive") {
                setTimeout(runPrint, 300);
              } else {
                window.onload = function() {
                  setTimeout(runPrint, 300);
                };
              }
            </script>
          </body>
        </html>
      `);
      doc.close();

      setTimeout(() => {
        try {
          if (printWindow) {
            printWindow.focus();
            printWindow.print();
          } else if (iframe) {
            iframe.contentWindow?.focus();
            iframe.contentWindow?.print();
          }
        } catch (e) {
          console.warn("Direct print trigger blocked:", e);
          if (!printWindow) {
            window.print();
          }
        }
        if (iframe) {
          setTimeout(() => {
            try {
              document.body.removeChild(iframe!);
            } catch (err) {}
          }, 10000);
        }
      }, 500);
    }
  };

  // Filter cases and clients based on the searchTerm
  const filteredCases = cases.filter((c) => {
    // Filter by subTab first
    if (subTab === "cases" && c.status === "مختومه") return false;
    if (subTab === "closedCases" && c.status !== "مختومه") return false;

    const title = c.title || "";
    const clientName = c.clientName || "";
    const caseNumber = c.caseNumber || "";
    const archiveNumber = c.archiveNumber || "";
    const term = searchTerm.trim().toLowerCase();
    if (!term) return true;
    return (
      title.toLowerCase().includes(term) ||
      clientName.toLowerCase().includes(term) ||
      caseNumber.toLowerCase().includes(term) ||
      archiveNumber.toLowerCase().includes(term)
    );
  });

  const filteredClients = clients.filter((cl) => {
    const name = cl.name || "";
    const nationalId = cl.nationalId || "";
    const phoneNumber = cl.phoneNumber || "";
    const fatherName = cl.fatherName || "";
    const term = searchTerm.trim().toLowerCase();
    if (!term) return true;
    return (
      name.toLowerCase().includes(term) ||
      nationalId.toLowerCase().includes(term) ||
      phoneNumber.toLowerCase().includes(term) ||
      fatherName.toLowerCase().includes(term)
    );
  });

  return (
    <div className="space-y-6">
      {/* Sub tabs and Add commands */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-4 border-b border-slate-100 pb-4">
        {/* Navigation toggles */}
        <div className="flex gap-2 p-1 bg-slate-100 rounded-xl max-w-2xl overflow-x-auto shrink-0 self-start border border-slate-200">
          <button
            onClick={() => {
              setSubTab("cases");
              setSearchTerm("");
            }}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-bold transition select-none cursor-pointer whitespace-nowrap min-w-max duration-150 ${
              subTab === "cases" ? "bg-white text-slate-900 shadow-sm" : "text-slate-500 hover:text-slate-800"
            }`}
          >
            <Briefcase className="w-4 h-4" />
            پرونده‌های جاری ({toPersianDigits(cases.filter(c => c.status !== "مختومه").length)})
          </button>
          
          <button
            onClick={() => {
              setSubTab("closedCases");
              setSearchTerm("");
            }}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-bold transition select-none cursor-pointer whitespace-nowrap min-w-max duration-150 ${
              subTab === "closedCases" ? "bg-white text-slate-900 shadow-sm" : "text-slate-500 hover:text-slate-800"
            }`}
          >
            <FolderArchive className="w-4 h-4" />
            پرونده‌های مختومه ({toPersianDigits(cases.filter(c => c.status === "مختومه").length)})
          </button>
          
          <button
            onClick={() => {
              setSubTab("clients");
              setSearchTerm("");
            }}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-bold transition select-none cursor-pointer whitespace-nowrap min-w-max duration-150 ${
              subTab === "clients" ? "bg-white text-slate-900 shadow-sm" : "text-slate-500 hover:text-slate-800"
            }`}
          >
            <User className="w-4 h-4" />
            اطلاعات موکلین ({toPersianDigits(clients.length)})
          </button>
        </div>

        {/* Dynamic add buttons */}
        <div>
          {(subTab === "cases" || subTab === "closedCases") ? (
            <button
              onClick={() => {
                resetCaseFormStates();
                setShowCaseTypeModal(true);
              }}
              disabled={clients.length === 0}
              className="px-4 py-2.5 bg-slate-900 hover:bg-amber-600 text-white rounded-xl text-xs font-bold flex items-center gap-2 transition disabled:opacity-50 select-none cursor-pointer"
            >
              <FolderPlus className="w-4 h-4" />
              تشکیل پرونده جدید
            </button>
          ) : (
            <button
              onClick={() => {
                  setEditingClient(null);
                  setClientName("");
                  setClientNatId("");
                  setClientPhone("");
                  setClientFather("");
                  setClientBirthDate("");
                  setClientAddress("");
                  setClientDesc("");
                  setShowClientForm(true);
              }}
              className="px-4 py-2.5 bg-slate-900 hover:bg-amber-600 text-white rounded-xl text-xs font-bold flex items-center gap-2 transition select-none cursor-pointer"
            >
              <UserPlus className="w-4 h-4" />
              افزودن پروفایل موکل جدید
            </button>
          )}
        </div>
      </div>

      {/* --- Global Search Bar --- */}
      <div className="bg-slate-50/50 border border-slate-200/85 p-4 rounded-2xl flex flex-col sm:flex-row gap-3 items-stretch sm:items-center justify-between">
        <div className="relative flex-1 max-w-lg">
          <Search className="w-4 h-4 absolute right-3.5 top-3 text-slate-400" />
          <input
            type="text"
            placeholder={
              subTab === "cases"
                ? "جستجوی کلاسه، موضوع دعوی یا نام موکل پرونده..."
                : "جستجوی موکل با نامثبتی، کد ملی، شماره موبایل یا نام پدر..."
            }
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pr-10 pl-4 py-2 bg-white border border-slate-250 rounded-xl text-xs font-bold font-sans outline-none focus:ring-1 focus:ring-slate-950 shadow-3xs text-slate-800"
          />
        </div>
        {searchTerm && (
          <button
            onClick={() => setSearchTerm("")}
            className="text-[11px] font-black text-rose-600 hover:text-rose-700 bg-rose-50 border border-rose-150 px-3 py-1.5 rounded-xl cursor-pointer select-none transition shrink-0"
          >
            پاک کردن فیلتر جستجو
          </button>
        )}
      </div>

      <div className="flex items-center justify-end gap-2 mb-4">
        {subTab === "cases" && (
          <button
            onClick={() => {
              setEditingCase(null);
              resetCaseFormStates();
              setShowCaseTypeModal(true);
            }}
            className="px-4 py-2 bg-slate-900 hover:bg-slate-850 text-white rounded-xl text-[10px] font-black transition flex items-center gap-2 shadow-sm cursor-pointer select-none"
          >
            <Plus className="w-3.5 h-3.5" />
            ثبت پرونده جدید
          </button>
        )}
        {subTab === "clients" && (
          <button
            onClick={() => {
              setEditingClient(null);
              setShowClientForm(true);
            }}
            className="px-4 py-2 bg-slate-900 hover:bg-slate-850 text-white rounded-xl text-[10px] font-black transition flex items-center gap-2 shadow-sm cursor-pointer select-none"
          >
            <Plus className="w-3.5 h-3.5" />
            افزودن موکل جدید
          </button>
        )}
      </div>

      {clients.length === 0 && (subTab === "cases" || subTab === "closedCases") && (
        <div className="p-4 bg-amber-50 text-amber-900 text-xs border border-amber-200 rounded-xl flex items-center gap-3">
          <AlertCircle className="w-5 h-5 text-amber-600 shrink-0" />
          <span>هنوز هیچ موکلی ثبت نشده است؛ جهت ثبت پرونده ابتدا باید از بخش <strong>«اطلاعات موکلین»</strong> یک موکل ایجاد نمایید.</span>
        </div>
      )}

      {/* --- Tab 1: Cases Table/List --- */}
      {(subTab === "cases" || subTab === "closedCases") && (
        <div className="bg-white border border-slate-100 shadow-sm rounded-2xl overflow-hidden">
          {cases.filter(c => subTab === "cases" ? c.status !== "مختومه" : c.status === "مختومه").length === 0 ? (
            <div className="text-center py-24 text-slate-400">
              <FolderPlus className="w-12 h-12 stroke-1 mx-auto mb-2 text-slate-300" />
              <p className="text-xs">{subTab === "cases" ? "هیچ پرونده جاری و فعالی یافت نشد. پرونده جدید ایجاد نمایید." : "هیچ پرونده مختومه‌ای یافت نشد."}</p>
            </div>
          ) : filteredCases.length === 0 ? (
            <div className="text-center py-16 text-slate-450 bg-slate-50/50">
              <Search className="w-10 h-10 stroke-1 mx-auto mb-2 text-slate-300" />
              <p className="text-xs font-black text-slate-700">پرونده‌ای منطبق با عبارت جستجو یافت نشد.</p>
              <p className="text-[10px] text-slate-450 mt-1 font-semibold">لطفاً املای صحیح نام موکل یا موضوع دعوی را بررسی کنید.</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-right text-xs">
                <thead>
                  <tr className="bg-slate-50 text-slate-500 font-bold border-b border-slate-100">
                    <th className="p-4">شماره پرونده / موضوع دعوی</th>
                    <th className="p-4">نام خواهان / موکل</th>
                    <th className="p-4">مرحله فعلی</th>
                    <th className="p-4">شعبه رسیدگی‌کننده</th>
                    <th className="p-4">وضعیت پرونده</th>
                    <th className="p-4 text-center">عملیات</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 font-medium">
                  {filteredCases.map((c) => (
                    <tr key={c.id} className="hover:bg-slate-50/50 transition">
                      <td className="p-4">
                        <div>
                          <p className="font-bold text-slate-800 text-sm">
                            {toPersianDigits(c.title)}
                          </p>
                          <p className="text-[10px] font-mono text-slate-400 mt-1 flex flex-wrap items-center gap-2">
                            <span>{c.category === 'اظهارنامه' ? 'شماره اظهارنامه:' : 'شماره پرونده:'} {toPersianDigits(c.caseNumber)}</span>
                            {c.contractNumber && (
                              <span className="font-sans font-bold text-[9px] text-amber-700 bg-amber-50 px-1.5 py-0.5 rounded border border-amber-100">
                                قرارداد: {toPersianDigits(c.contractNumber)}
                              </span>
                            )}
                          </p>
                        </div>
                      </td>
                      <td className="p-4 text-slate-700">{c.clientName}</td>
                      <td className="p-4">
                        <span className="px-2.5 py-1 bg-slate-100 text-slate-700 rounded-lg font-bold text-[11px]">
                          {c.stage}
                        </span>
                      </td>
                      <td className="p-4 text-slate-500 max-w-xs truncate" title={c.branch}>{toPersianDigits(c.branch)}</td>
                      <td className="p-4">
                        <span
                          className={`px-2 py-1 rounded-lg text-[10px] font-bold ${
                            c.status === "جریان دارد"
                              ? "bg-green-50 text-green-700 border border-green-100"
                              : c.status === "مختومه"
                              ? "bg-rose-50 text-rose-700 border border-rose-100"
                              : c.status === "منتظر ابلاغ" || c.status === "در انتظار رای"
                              ? "bg-amber-50 text-amber-700 border border-amber-100"
                              : "bg-slate-100 text-slate-600"
                          }`}
                        >
                          {c.status}
                        </span>
                      </td>
                      <td className="p-4 text-center">
                        <div className="flex justify-center gap-1">
                          <button
                            onClick={() => {
                              const isClosing = c.status !== "مختومه";
                              const newStatus = isClosing ? "مختومه" : "جریان دارد";
                              let updatedCase = { ...c, status: newStatus as CaseStatus };
                              if (isClosing) {
                                const today = getCurrentJalali();
                                updatedCase.closedDate = toPersianDigits(formatJalaliDate(today.jy, today.jm, today.jd));
                              } else {
                                updatedCase.closedDate = "";
                              }
                              onUpdateCase(updatedCase);
                            }}
                            className={`px-2 py-1 rounded-lg text-[10px] font-bold transition flex items-center gap-1 ${
                              c.status === "مختومه"
                                ? "bg-green-100 text-green-700 hover:bg-green-200"
                                : "bg-slate-200 text-slate-700 hover:bg-slate-300"
                            }`}
                            title={c.status === "مختومه" ? "تغییر وضعیت به جریان دارد" : "تغییر وضعیت به مختومه"}
                          >
                            <RefreshCw className="w-3 h-3" />
                            {c.status === "مختومه" ? "جریان دارد" : "مختومه"}
                          </button>
                          <button
                            onClick={() => setPrintableCase(c)}
                            className="px-2 py-1 bg-slate-100 hover:bg-amber-50 text-slate-800 border border-slate-200 hover:border-amber-200 rounded-lg text-[10px] font-bold transition flex items-center gap-1"
                            title="نمایش پرونده جهت چاپ و خروجی PDF"
                          >
                            <Eye className="w-3.5 h-3.5 text-amber-600" />
                            نمایش
                          </button>
                          <button
                            onClick={() => setSelectedCase(c)}
                            className="px-2 py-1 bg-slate-900 text-white rounded-lg text-[10px] font-bold hover:bg-amber-600 transition"
                          >
                            مدارک
                          </button>
                          <button
                            onClick={() => setShowNotesManager(c)}
                            className="px-2 py-1 bg-amber-600 text-white rounded-lg text-[10px] font-bold hover:bg-amber-700 transition flex items-center gap-1"
                          >
                            یادداشت
                            {notes.filter(n => n.caseId === c.id).length > 0 && (
                              <span className="bg-amber-800 px-1.5 py-0.5 rounded-md text-[9px] font-mono leading-none">
                                {toPersianDigits(notes.filter(n => n.caseId === c.id).length)}
                              </span>
                            )}
                          </button>
                          <button
                            onClick={() => {
                              setEditingCase(c);
                              setSelectedCaseCategory(c.category || "حقوقی");
                              setShowCaseForm(true);
                              // Pre-fill states here
                              setCaseClientId(c.clientId);
                              setCaseNo(toEnglishDigits(c.caseNumber || "").replace(/\D/g, ""));
                              setCourtCaseNo(c.courtCaseNumber ? toEnglishDigits(c.courtCaseNumber).replace(/\D/g, "") : "");
                              setCaseArchiveNo(c.archiveNumber ? toEnglishDigits(c.archiveNumber) : "");
                              setAppealCaseNo(c.appealCaseNumber ? toEnglishDigits(c.appealCaseNumber).replace(/\D/g, "") : "");
                              setRejectionCaseNo(c.rejectionCaseNumber ? toEnglishDigits(c.rejectionCaseNumber).replace(/\D/g, "") : "");
                              setSupremeCaseNo(c.supremeCaseNumber ? toEnglishDigits(c.supremeCaseNumber).replace(/\D/g, "") : "");
                              setExecutionCaseNo(c.executionCaseNumber ? toEnglishDigits(c.executionCaseNumber).replace(/\D/g, "") : "");
                              setExecutionCivilCaseNo(c.executionCivilCaseNumber ? toEnglishDigits(c.executionCivilCaseNumber).replace(/\D/g, "") : "");
                              setInsolvencyCaseNo(c.insolvencyCaseNumber ? toEnglishDigits(c.insolvencyCaseNumber).replace(/\D/g, "") : "");
                              setInvestigationCaseNo(c.investigationCaseNumber ? toEnglishDigits(c.investigationCaseNumber).replace(/\D/g, "") : "");
                              setProsecutionCaseNo(c.prosecutionCaseNumber ? toEnglishDigits(c.prosecutionCaseNumber).replace(/\D/g, "") : "");
                              setDeclarationTrackingCode(c.declarationTrackingCode || "");
                              setDeclarationSendDate(c.declarationSendDate || "");
                              setDeclarationSendGracePeriod(c.declarationSendGracePeriod || "");
                              setDeclarationReceiveDate(c.declarationReceiveDate || "");
                              setDeclarationReceiveGracePeriod(c.declarationReceiveGracePeriod || "");
                              setCaseFilingDate(c.filingDate || "");
                              setCaseClosedDate(c.closedDate || "");
                              setCaseCourtRegistrationDate(c.courtRegistrationDate || "");
                              setCasePowerOfAttorneyDate(c.powerOfAttorneyDate || "");
                              setCaseTitle(c.title);
                              setCaseOpposingName(c.opposingPartyName || "");
                              setCaseClientRole(c.clientRole || "خواهان");
                              setCaseStage(c.stage);
                              setCaseStages(c.stages || {});
                              setCaseBranch(c.branch || "");
                              setCaseStatus(c.status);
                              setCaseDesc(c.description || "");
                              setCaseSanaPassword(c.sanaPassword || "");
                              setCaseContractNo(c.contractNumber ? toEnglishDigits(c.contractNumber) : "");
                              setCaseTotalContractAmount(c.totalContractAmount ? c.totalContractAmount.toString() : "");
                              setCaseDownPayment(c.downPayment ? c.downPayment.toString() : "");
                              setCasePayments(c.payments?.map(p => ({ ...p, amount: p.amount.toString(), cardNumber: p.cardNumber || "", receiptImage: p.receiptImage })) || []);
                              setCaseInstallments(c.installments?.map(i => ({ ...i, amount: i.amount.toString() })) || []);
                              setCaseAssociatedPersons(c.associatedPersons || []);
                              setCaseFormStep(1);
                            }}
                            className="px-2 py-1 bg-amber-500 text-white rounded-lg text-[10px] font-bold hover:bg-amber-600 transition"
                          >
                            ویرایش
                          </button>
                          <button
                            onClick={(e) => { e.stopPropagation(); onDeleteCase(c.id); }}
                            className="p-1 text-red-500 hover:bg-red-50 rounded-lg transition"
                            title="حذف کلی پرونده"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* --- Tab 2: Clients list --- */}
      {subTab === "clients" && (
        <div className="bg-white border border-slate-100 shadow-sm rounded-2xl overflow-hidden animate-fadeIn">
          {clients.length === 0 ? (
            <div className="text-center py-24 text-slate-400">
              <UserPlus className="w-12 h-12 stroke-1 mx-auto mb-2 text-slate-300" />
              <p className="text-xs">پروفایل موکلی ثبت نشده است؛ جهت تنظیم وکالتنامه موکل جدید اضافه کنید.</p>
            </div>
          ) : filteredClients.length === 0 ? (
            <div className="text-center py-16 text-slate-450 bg-slate-50/50">
              <Search className="w-10 h-10 stroke-1 mx-auto mb-2 text-slate-300" />
              <p className="text-xs font-black text-slate-700">موکلی با مشخصات وارد شده یافت نشد.</p>
              <p className="text-[10px] text-slate-450 mt-1 font-semibold">لطفاً صحت کدملی، شماره تلفن یا نام موکل را بررسی نمایید.</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-right text-xs">
                <thead>
                  <tr className="bg-slate-50 text-slate-500 font-bold border-b border-slate-100 text-xs">
                    <th className="p-4">نام موکل</th>
                    <th className="p-4">شناسه ملی</th>
                    <th className="p-4">شماره تماس پیامک ثنا</th>
                    <th className="p-4">نام پدر</th>
                    <th className="p-4">تاریخ تولد</th>
                    <th className="p-4">نشانی قانونی پستی</th>
                    <th className="p-4 text-center">عملیات</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 font-semibold text-slate-700">
                  {filteredClients.map((cl) => (
                    <tr key={cl.id} className="hover:bg-slate-50/50 transition">
                      <td className="p-4 text-slate-900 font-bold">{cl.name}</td>
                      <td className="p-4 font-mono">{toPersianDigits(cl.nationalId)}</td>
                      <td className="p-4 font-mono">{toPersianDigits(cl.phoneNumber)}</td>
                      <td className="p-4">{cl.fatherName}</td>
                      <td className="p-4 font-mono">{cl.birthDate ? toPersianDigits(cl.birthDate) : "-"}</td>
                      <td className="p-4 text-slate-500 max-w-sm truncate" title={cl.address}>{toPersianDigits(cl.address)}</td>
                      <td className="p-4 text-center">
                        <div className="flex justify-center gap-2">
                            <button
                                onClick={() => setContactClient(cl)}
                                className="p-1.5 text-green-600 hover:bg-green-50 rounded-lg transition"
                                title="ارتباط با موکل"
                            >
                                <MessageCircle className="w-4 h-4" />
                            </button>
                            <button
                                onClick={() => {
                                    setEditingClient(cl);
                                    setClientName(cl.name);
                                    setClientNatId(cl.nationalId);
                                    setClientPhone(cl.phoneNumber);
                                    setClientFather(cl.fatherName);
                                    setClientBirthDate(cl.birthDate || "");
                                    setClientAddress(cl.address);
                                    setClientDesc(cl.description || "");
                                    setShowClientForm(true);
                                }}
                                className="p-1.5 text-blue-500 hover:bg-blue-50 rounded-lg transition"
                                title="ویرایش پروفایل موکل"
                            >
                                <Edit2 className="w-4 h-4" />
                            </button>
                            <button
                                onClick={() => setPrintableClient(cl)}
                                className="p-1.5 text-amber-600 hover:bg-amber-50 rounded-lg transition"
                                title="نمایش و چاپ اطلاعات موکل"
                            >
                                <Eye className="w-4 h-4" />
                            </button>
                            <button
                                onClick={(e) => { e.stopPropagation(); onDeleteClient(cl.id); }}
                                className="p-1.5 text-red-500 hover:bg-red-50 rounded-lg transition"
                                title="حذف پرونده موکل"
                            >
                                <Trash2 className="w-4 h-4" />
                            </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* --- DIALOG MODALS --- */}

      {/* Modal: Contact Client */}
      {contactClient && (
        <div className="fixed inset-0 bg-slate-900/60 flex items-center justify-center p-4 z-50 animate-fadeIn backdrop-blur-sm" onClick={() => setContactClient(null)}>
          <div className="bg-white rounded-2xl border border-slate-100 shadow-xl max-w-sm w-full p-6 space-y-4 text-xs font-bold text-slate-700" onClick={e => e.stopPropagation()}>
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h3 className="text-sm font-bold text-slate-800 flex items-center gap-2">
                <MessageCircle className="w-5 h-5 text-green-500" />
                ارتباط با {contactClient.name}
              </h3>
              <button 
                onClick={() => setContactClient(null)}
                className="text-slate-400 hover:text-slate-600 bg-slate-50 hover:bg-slate-100 p-1.5 rounded-lg transition"
              >
                ✕
              </button>
            </div>
            <div className="space-y-3">
              <p className="text-slate-500 mb-3 text-center">شماره تماس: <span className="font-mono">{toPersianDigits(contactClient.phoneNumber)}</span></p>
              
              <a href={`sms:${contactClient.phoneNumber}`} className="flex items-center gap-3 w-full p-3 rounded-xl border border-slate-100 hover:border-blue-200 hover:bg-blue-50 transition text-slate-700">
                <div className="w-8 h-8 rounded-full bg-blue-100 text-blue-600 flex items-center justify-center shrink-0">
                  <MessageCircle className="w-4 h-4" />
                </div>
                <span>ارسال پیامک (SMS)</span>
              </a>

              <a href={`rubika://`} onClick={(e) => {
                e.preventDefault();
                const phone = getStandardPhone(contactClient.phoneNumber);
                navigator.clipboard.writeText(contactClient.phoneNumber).catch(() => {});
                
                // Try mobile scheme first
                window.location.href = `rubika://resolve?phone=+98${phone}`;
                
                // Fallback to web version after a short delay
                setTimeout(() => {
                  window.open(`https://web.rubika.ir/#/`, '_blank');
                }, 1000);
              }} className="flex items-center gap-3 w-full p-3 rounded-xl border border-slate-100 hover:border-purple-200 hover:bg-purple-50 transition text-slate-700" title="ابتدا در اپلیکیشن موبایل تلاش می‌شود، در صورت عدم نصب نسخه وب را باز می‌کند.">
                <div className="w-8 h-8 rounded-full bg-purple-100 text-purple-600 flex items-center justify-center shrink-0 flex-col">
                  <span className="text-[10px] font-black leading-none">R</span>
                </div>
                <div className="flex flex-col">
                  <span>ارسال پیام در روبیکا</span>
                  <span className="text-[8px] font-normal text-slate-400 mt-0.5">باز کردن در اپلیکیشن یا وب</span>
                </div>
              </a>

              <a href={`eitaa://`} onClick={(e) => {
                e.preventDefault();
                const phone = getStandardPhone(contactClient.phoneNumber);
                navigator.clipboard.writeText(contactClient.phoneNumber).catch(() => {});
                
                // Try mobile scheme first
                window.location.href = `eitaa://resolve?phone=+98${phone}`;
                
                // Fallback to web version after a short delay
                setTimeout(() => {
                  window.open(`https://eitaa.com/`, '_blank');
                }, 1000);
              }} className="flex items-center gap-3 w-full p-3 rounded-xl border border-slate-100 hover:border-orange-200 hover:bg-orange-50 transition text-slate-700" title="ابتدا در اپلیکیشن موبایل تلاش می‌شود، در صورت عدم نصب نسخه وب را باز می‌کند.">
                <div className="w-8 h-8 rounded-full bg-orange-100 text-orange-600 flex items-center justify-center shrink-0 flex-col">
                  <span className="text-[10px] font-black leading-none">E</span>
                </div>
                <div className="flex flex-col">
                  <span>ارسال پیام در ایتا</span>
                  <span className="text-[8px] font-normal text-slate-400 mt-0.5">باز کردن در اپلیکیشن یا وب</span>
                </div>
              </a>

              <a href={`tg://resolve?phone=98${getStandardPhone(contactClient.phoneNumber)}`} target="_blank" rel="noopener noreferrer" className="flex items-center gap-3 w-full p-3 rounded-xl border border-slate-100 hover:border-sky-200 hover:bg-sky-50 transition text-slate-700">
                <div className="w-8 h-8 rounded-full bg-sky-100 text-sky-600 flex items-center justify-center shrink-0">
                  <span className="text-[10px] font-black leading-none">T</span>
                </div>
                <span>ارسال پیام در تلگرام</span>
              </a>

              <a href={`https://wa.me/98${getStandardPhone(contactClient.phoneNumber)}`} target="_blank" rel="noopener noreferrer" className="flex items-center gap-3 w-full p-3 rounded-xl border border-slate-100 hover:border-emerald-200 hover:bg-emerald-50 transition text-slate-700" title="در صورت مشاهده خطای نامعتبر بودن شماره، یعنی این شماره در واتساپ حساب کاربری ندارد.">
                <div className="w-8 h-8 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center shrink-0">
                  <span className="text-[10px] font-black leading-none">W</span>
                </div>
                <span>ارسال پیام در واتساپ</span>
              </a>

            </div>
          </div>
        </div>
      )}

      {/* Modal 1: Register Client Profile */}
      {showClientForm && (
        <div className="fixed inset-0 bg-slate-900/60 flex items-center justify-center p-4 z-50 animate-fadeIn backdrop-blur-sm">
          <div className="bg-white rounded-2xl border border-slate-100 shadow-xl max-w-lg w-full p-6 space-y-4 text-xs font-bold text-slate-700">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h3 className="text-sm font-bold text-slate-800 flex items-center gap-2">
                <UserPlus className="w-5 h-5 text-amber-500" />
                {editingClient ? "ویرایش پروفایل موکل" : "ثبت پروفایل موکل"}
              </h3>
              <button onClick={() => setShowClientForm(false)} className="text-slate-400 hover:text-slate-600 font-bold p-1 cursor-pointer">✕</button>
            </div>

            <form onSubmit={handleCreateClient} className="space-y-4">
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="text-slate-500">نام و نام خانوادگی موکل</label>
                  <input
                    type="text"
                    required
                    value={clientName}
                    onChange={(e) => setClientName(e.target.value)}
                    placeholder="مثال: زهرا حسینی"
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl outline-none focus:ring-1 focus:ring-slate-900 text-xs font-medium"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-slate-500">کد ملی ثنا (۱۰ رقم)</label>
                  <input
                    type="text"
                    required
                    maxLength={10}
                    value={clientNatId}
                    onChange={(e) => setClientNatId(e.target.value)}
                    placeholder="مثال: ۰۰۸۷۶۵۴۳۲۱"
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl outline-none focus:ring-1 focus:ring-slate-900 font-mono text-xs font-medium"
                  />
                </div>
              </div>

              <div className="grid grid-cols-3 gap-3">
                <div className="space-y-1 col-span-1">
                  <label className="text-slate-500">تاریخ تولد</label>
                  <input
                    type="text"
                    value={clientBirthDate}
                    onChange={(e) => setClientBirthDate(formatDateWithSlash(e.target.value))}
                    placeholder="مثال: ۱۳۶۰/۰۱/۰۱"
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl outline-none focus:ring-1 focus:ring-slate-900 font-mono text-xs font-medium"
                  />
                </div>
                <div className="space-y-1 col-span-1">
                  <label className="text-slate-500">شماره موبایل</label>
                  <input
                    type="text"
                    required
                    maxLength={11}
                    value={clientPhone}
                    onChange={(e) => setClientPhone(e.target.value)}
                    placeholder="مثال: ۰۹۱۹۸۷۶۵۴۳۲"
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl outline-none focus:ring-1 focus:ring-slate-900 font-mono text-xs font-medium"
                  />
                </div>
                <div className="space-y-1 col-span-1">
                  <label className="text-slate-500">نام پدر موکّل</label>
                  <input
                    type="text"
                    required
                    value={clientFather}
                    onChange={(e) => setClientFather(e.target.value)}
                    placeholder="مثال: علی"
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl outline-none focus:ring-1 focus:ring-slate-900 text-xs font-medium"
                  />
                </div>
              </div>

              <div className="space-y-1">
                <label className="text-slate-500">نشانی قانونی پستی سکونت</label>
                <input
                  type="text"
                  required
                  value={clientAddress}
                  onChange={(e) => setClientAddress(e.target.value)}
                  placeholder="مثال: تهران، یوسف آباد، خیابان چهاردهم..."
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl outline-none focus:ring-1 focus:ring-slate-900 text-xs font-medium"
                />
              </div>

              <div className="space-y-1">
                <label className="text-slate-500">یادداشت اداری / سوابق یا صنف موکل</label>
                <textarea
                  value={clientDesc}
                  onChange={(e) => setClientDesc(e.target.value)}
                  rows={2}
                  placeholder="توضیحات در مورد هویت، کار یا پیشینه..."
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl outline-none focus:ring-1 focus:ring-slate-900 resize-none text-xs font-medium"
                />
              </div>

              <div className="flex gap-2 pt-2">
                <button type="submit" className="flex-1 py-3 bg-slate-900 hover:bg-amber-600 text-white rounded-xl font-bold transition select-none cursor-pointer">
                    {editingClient ? "ذخیره تغییرات" : "ثبت و ایجاد پرونده هویتی"}
                </button>
                <button type="button" onClick={() => { setEditingClient(null); setShowClientForm(false); }} className="px-5 py-3 bg-slate-100 hover:bg-slate-200 text-slate-600 rounded-xl font-bold transition select-none cursor-pointer">انصراف</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Case Type Selection Modal */}
      {showCaseTypeModal && (
        <div className="fixed inset-0 bg-slate-900/60 flex items-center justify-center p-4 z-50 animate-fadeIn backdrop-blur-sm">
          <div className="bg-white rounded-2xl border border-slate-100 shadow-xl max-w-2xl w-full p-5 space-y-4 text-xs font-bold text-slate-700">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h3 className="text-sm font-bold text-slate-800 flex items-center gap-2">
                <FolderPlus className="w-5 h-5 text-amber-500" />
                انتخاب نوع پرونده
              </h3>
              <button onClick={() => setShowCaseTypeModal(false)} className="text-slate-400 hover:text-slate-600 p-1 cursor-pointer">✕</button>
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
              {["حقوقی", "کیفری", "تعزیرات حکومتی", "اداره کار", "سایر مراجع", "تامین دلیل", "اظهارنامه"].map((type) => (
                <button
                  key={type}
                  onClick={() => {
                    setSelectedCaseCategory(type);
                    if (type === 'اظهارنامه') {
                      setCaseClientRole('ارسال کننده اظهارنامه');
                    } else {
                      setCaseClientRole('خواهان');
                    }
                    setShowCaseTypeModal(false);
                    setShowCaseForm(true);
                  }}
                  className={`p-4 rounded-xl border text-center transition flex flex-col items-center justify-center gap-2 cursor-pointer ${
                    selectedCaseCategory === type 
                      ? "border-amber-500 bg-amber-50 text-amber-900" 
                      : "border-slate-200 bg-slate-50 hover:bg-slate-100 text-slate-700 hover:border-slate-300"
                  }`}
                >
                  <Folder className="w-6 h-6 text-slate-400" />
                  <span className="font-bold text-sm">{type}</span>
                </button>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Modal 2: Form New Case */}
      {showCaseForm && (
        <div className="fixed inset-0 bg-slate-900/60 flex items-center justify-center p-4 z-50 animate-fadeIn backdrop-blur-sm">
          <div className="bg-white rounded-2xl border border-slate-100 shadow-xl max-w-5xl w-full p-5 space-y-4 text-xs font-bold text-slate-700 max-h-[92vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div className="flex flex-col">
                <h3 className="text-sm font-bold text-slate-800 flex items-center gap-2">
                  <FolderPlus className="w-5 h-5 text-amber-500" />
                  تشکیل پرونده جدید
                </h3>
                <span className="text-[10px] text-slate-400 mt-0.5">شماره‌های تماس دائمی: ۰۹۱۴۴۶۲۷۱۱۹ - ۰۹۹۰۱۰۹۵۳۹۳</span>
              </div>
              <button onClick={() => { setShowCaseForm(false); setEditingCase(null); }} className="text-slate-400 hover:text-slate-600 p-1 cursor-pointer">✕</button>
            </div>

            <form onSubmit={(e) => {
              e.preventDefault();
              if (editingCase) {
                if (!caseClientId) {
                  alert("لطفاً موکل مرتبط را انتخاب نمایید.");
                  return;
                }
                if (!caseTitle.trim()) {
                  alert("لطفاً موضوع دعوی (خواسته) را وارد نمایید.");
                  return;
                }
                // Update
                const totalContractAmountNum = parseDigits(caseTotalContractAmount);
                const downPaymentNum = parseDigits(caseDownPayment);
                const installmentsData = caseInstallments.map(ins => ({
                  id: ins.id || "ins_" + Date.now() + Math.random(),
                  amount: parseDigits(ins.amount),
                  dueDate: ins.dueDate,
                  isPaid: ins.isPaid,
                  paidDate: ins.paidDate,
                  note: ins.note || ""
                }));
                const paymentsData = casePayments.map(p => ({
                  id: p.id, title: p.title, amount: parseDigits(p.amount), type: p.type, date: p.date, cardNumber: p.cardNumber, receiptImage: p.receiptImage
                }));

                const updatedCase: LegalCase = {
                  ...editingCase,
                  clientId: caseClientId,
                  clientName: clients.find(cl => cl.id === caseClientId)?.name || editingCase.clientName,
                  clientRole: caseClientRole,
                  category: selectedCaseCategory,
                  opposingPartyName: caseOpposingName,
                  caseNumber: toPersianDigits(caseNo),
                  declarationTrackingCode: declarationTrackingCode ? toPersianDigits(declarationTrackingCode) : undefined,
                  declarationSendDate: declarationSendDate ? toPersianDigits(declarationSendDate) : undefined,
                  declarationSendGracePeriod: declarationSendGracePeriod ? toPersianDigits(declarationSendGracePeriod) : undefined,
                  declarationReceiveDate: declarationReceiveDate ? toPersianDigits(declarationReceiveDate) : undefined,
                  declarationReceiveGracePeriod: declarationReceiveGracePeriod ? toPersianDigits(declarationReceiveGracePeriod) : undefined,
                  archiveNumber: caseArchiveNo ? toPersianDigits(caseArchiveNo) : undefined,
                  courtCaseNumber: courtCaseNo ? toPersianDigits(courtCaseNo) : undefined,
                  appealCaseNumber: appealCaseNo ? toPersianDigits(appealCaseNo) : undefined,
                  rejectionCaseNumber: rejectionCaseNo ? toPersianDigits(rejectionCaseNo) : undefined,
                  supremeCaseNumber: supremeCaseNo ? toPersianDigits(supremeCaseNo) : undefined,
                  executionCaseNumber: executionCaseNo ? toPersianDigits(executionCaseNo) : undefined,
                  executionCivilCaseNumber: executionCivilCaseNo ? toPersianDigits(executionCivilCaseNo) : undefined,
                  insolvencyCaseNumber: insolvencyCaseNo ? toPersianDigits(insolvencyCaseNo) : undefined,
                  investigationCaseNumber: investigationCaseNo ? toPersianDigits(investigationCaseNo) : undefined,
                  prosecutionCaseNumber: prosecutionCaseNo ? toPersianDigits(prosecutionCaseNo) : undefined,
                  filingDate: caseFilingDate ? toPersianDigits(caseFilingDate) : undefined,
                  closedDate: caseClosedDate ? toPersianDigits(caseClosedDate) : undefined,
                  courtRegistrationDate: caseCourtRegistrationDate ? toPersianDigits(caseCourtRegistrationDate) : undefined,
                  powerOfAttorneyDate: casePowerOfAttorneyDate ? toPersianDigits(casePowerOfAttorneyDate) : undefined,
                  title: caseTitle,
                  stage: caseStage,
                  stages: caseStages,
                  branch: caseBranch,
                  status: caseStatus,
                  description: caseDesc,
                  payments: paymentsData,
                  totalContractAmount: totalContractAmountNum,
                  downPayment: downPaymentNum,
                  sanaPassword: caseSanaPassword,
                  contractNumber: caseContractNo ? toPersianDigits(caseContractNo) : undefined,
                  installments: installmentsData,
                  associatedPersons: caseAssociatedPersons
                };
                onUpdateCase(updatedCase);
                
                caseTempDocs.forEach(td => {
                  const newDoc: CaseDocument = {
                    id: "doc_" + Date.now() + Math.random(),
                    caseId: updatedCase.id,
                    name: td.name,
                    type: td.type as any,
                    size: td.size,
                    dataUrl: td.dataUrl,
                    uploadedAt: new Date().toLocaleDateString("fa-IR", { year: "numeric", month: "long", day: "numeric" }),
                    tag: "عادی"
                  };
                  if (td.dataUrl) {
                    documentDb.set(newDoc.id, td.dataUrl);
                  }
                  onAddDocument(newDoc);
                });

                setShowCaseForm(false);
                setEditingCase(null);
              } else {
                const isSaved = handleCreateCase(e);
                if (isSaved) {
                  setShowCaseForm(false);
                  setEditingCase(null);
                }
              }
            }} className="space-y-4">
              {/* تب‌های راهنما برای سهولت دسترسی کاربران به بخش مالی و پرونده */}
              <div className="flex border-b border-slate-100 pb-2 mb-2 gap-4">
                <button
                  type="button"
                  onClick={() => setCaseFormStep(1)}
                  className={`pb-2 text-xs font-bold transition-all relative ${caseFormStep === 1 ? 'text-amber-600 border-b-2 border-amber-600' : 'text-slate-400 hover:text-slate-600'}`}
                >
                  ۱. مشخصات و مدارک پرونده
                </button>
                <button
                  type="button"
                  onClick={() => setCaseFormStep(2)}
                  className={`pb-2 text-xs font-bold transition-all relative ${caseFormStep === 2 ? 'text-amber-600 border-b-2 border-amber-600' : 'text-slate-400 hover:text-slate-600'}`}
                >
                  ۲. مدیریت مالی، وجوه و اقساط
                </button>
              </div>

              {/* جدول مشخصات و اطلاعات پرونده‌ای موکل منتخب (بخش خودکار) */}
              {caseFormStep === 1 && (
                <div className="space-y-3">
                  <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
                    <div className="space-y-1 col-span-1 sm:col-span-2 lg:col-span-2">
                       <label className="text-slate-500">انتخاب موکل مرتبط (پرونده پایه)</label>
                       <select
                         value={caseClientId}
                         onChange={(e) => setCaseClientId(e.target.value)}
                         className="w-full px-2 py-2 bg-slate-50 border border-slate-200 rounded-xl outline-none focus:ring-1 focus:ring-slate-900 text-xs font-medium"
                       >
                         <option value="">یک موکل انتخاب کنید...</option>
                         {clients.map(cl => (
                           <option key={cl.id} value={cl.id}>{cl.name} (کدملی: {toPersianDigits(cl.nationalId)})</option>
                         ))}
                       </select>
                    </div>

                    {/* کادر شماره پرونده جهت باز کردن پنجره اختصاصی شماره‌ها */}
                    {selectedCaseCategory !== 'اظهارنامه' ? (
                      <>
                        <div 
                          onClick={() => setShowCaseNumbersModal(true)}
                          className="col-span-1 sm:col-span-2 lg:col-span-2 border border-amber-200 bg-amber-50/30 hover:bg-amber-100/40 p-2.5 rounded-xl cursor-pointer transition flex items-center justify-between gap-3 text-amber-900 select-none"
                        >
                          <div className="flex items-center gap-2">
                            <div className="bg-amber-100 p-1.5 rounded-lg text-amber-600">
                              <Plus className="w-4 h-4" />
                            </div>
                            <div className="text-right">
                              <p className="font-extrabold text-xs text-slate-800">شماره پرونده</p>
                              <p className="text-[10px] text-slate-400 mt-0.5">ثنا، بدوی، تجدیدنظر، اجرای احکام و...</p>
                            </div>
                          </div>
                          <div className="text-left font-mono text-[10px] bg-white px-2 py-1 rounded border border-slate-100 text-slate-600 font-bold max-w-[150px] truncate">
                            {caseNo ? `ثنا: ${toPersianDigits(caseNo)}` : "تنظیم شماره‌ها"}
                          </div>
                        </div>

                        <div className="col-span-1 sm:col-span-2 lg:col-span-2 border border-amber-200 bg-amber-50/30 hover:bg-amber-100/40 p-2.5 rounded-xl cursor-pointer transition flex items-center justify-between gap-3 text-amber-900 select-none" onClick={() => setShowCaseDatesModal(true)}>
                          <div className="flex items-center gap-2">
                            <div className="bg-amber-100 p-1.5 rounded-lg text-amber-600">
                              <Calendar className="w-4 h-4" />
                            </div>
                            <div className="text-right">
                              <p className="font-extrabold text-xs text-slate-800">سابقه تاریخ پرونده</p>
                              <p className="text-[10px] text-slate-400 mt-0.5">تاریخ ثبت دادگستری، اخذ وکالت و...</p>
                            </div>
                          </div>
                          <div className="text-left font-mono text-[10px] bg-white px-2 py-1 rounded border border-slate-100 text-slate-600 font-bold max-w-[150px] truncate">
                            {caseFilingDate || caseCourtRegistrationDate || casePowerOfAttorneyDate ? "تنظیم شده" : "ثبت تاریخ‌ها"}
                          </div>
                        </div>
                      </>
                    ) : (
                      <div className="col-span-1 sm:col-span-2 lg:col-span-2 grid grid-cols-1 sm:grid-cols-2 gap-4 border border-slate-200 p-4 rounded-xl bg-slate-50/50">
                        <div className="space-y-1">
                          <label className="text-slate-500">شماره اظهارنامه *</label>
                          <input type="text" value={caseNo} onChange={(e) => setCaseNo(e.target.value)} className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl outline-none focus:ring-1 focus:ring-slate-900 text-xs font-medium" />
                        </div>
                        <div className="space-y-1">
                          <label className="text-slate-500">کد رهگیری اظهارنامه</label>
                          <input type="text" value={declarationTrackingCode} onChange={(e) => setDeclarationTrackingCode(e.target.value)} className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl outline-none focus:ring-1 focus:ring-slate-900 text-xs font-medium" />
                        </div>
                        <div className="space-y-1">
                          <label className="text-slate-500">تاریخ ارسال اظهارنامه</label>
                          <div className="flex gap-2">
                            <input type="text" placeholder="YYYY/MM/DD" value={declarationSendDate} onChange={(e) => setDeclarationSendDate(e.target.value)} className="w-2/3 px-3 py-2 bg-white border border-slate-200 rounded-xl outline-none focus:ring-1 focus:ring-slate-900 text-xs font-medium" />
                            <input type="text" placeholder="مهلت (روز)" value={declarationSendGracePeriod} onChange={(e) => setDeclarationSendGracePeriod(e.target.value)} className="w-1/3 px-3 py-2 bg-white border border-slate-200 rounded-xl outline-none focus:ring-1 focus:ring-slate-900 text-xs font-medium" />
                          </div>
                        </div>
                        <div className="space-y-1">
                          <label className="text-slate-500">تاریخ دریافت اظهارنامه</label>
                          <div className="flex gap-2">
                            <input type="text" placeholder="YYYY/MM/DD" value={declarationReceiveDate} onChange={(e) => setDeclarationReceiveDate(e.target.value)} className="w-2/3 px-3 py-2 bg-white border border-slate-200 rounded-xl outline-none focus:ring-1 focus:ring-slate-900 text-xs font-medium" />
                            <input type="text" placeholder="مهلت (روز)" value={declarationReceiveGracePeriod} onChange={(e) => setDeclarationReceiveGracePeriod(e.target.value)} className="w-1/3 px-3 py-2 bg-white border border-slate-200 rounded-xl outline-none focus:ring-1 focus:ring-slate-900 text-xs font-medium" />
                          </div>
                        </div>
                      </div>
                    )}

                    {/* موضوع دعوی (خواسته) / موضوع شکایت */}
                    <div className="space-y-1 col-span-1 sm:col-span-2 lg:col-span-2">
                      <label className="text-slate-500">
                        {selectedCaseCategory === 'اظهارنامه' ? 'موضوع اظهارنامه *' : 'موضوع دعوی (خواسته) / موضوع شکایت *'}
                      </label>
                      <input
                        type="text"
                        value={caseTitle}
                        onChange={(e) => setCaseTitle(e.target.value)}
                        placeholder="مثال: الزام به تنظیم سند رسمی..."
                        className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl outline-none focus:ring-1 focus:ring-slate-900 text-xs font-medium"
                      />
                    </div>

                    {/* نقش موکل در پرونده */}
                    <div className="space-y-1">
                      <label className="text-slate-500">نقش موکل در پرونده</label>
                      <select
                        value={caseClientRole}
                        onChange={(e) => setCaseClientRole(e.target.value as ClientPartyRole)}
                        className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl outline-none focus:ring-1 focus:ring-slate-900 font-medium text-xs text-slate-800"
                      >
                        {selectedCaseCategory === 'اظهارنامه' ? (
                          <>
                            <option value="ارسال کننده اظهارنامه">ارسال کننده اظهارنامه</option>
                            <option value="دریافت کننده اظهارنامه">دریافت کننده اظهارنامه</option>
                          </>
                        ) : selectedCaseCategory === 'کیفری' ? (
                          <>
                            <option value="شاکی">شاکی</option>
                            <option value="متشاکی">متشاکی</option>
                            <option value="متهم">متهم</option>
                          </>
                        ) : (
                          <>
                            <option value="خواهان">خواهان</option>
                            <option value="خوانده">خوانده</option>
                          </>
                        )}
                      </select>
                    </div>

                    {/* طرف مقابل */}
                    <div className="space-y-1 col-span-1 sm:col-span-2 lg:col-span-2">
                      <label className="text-slate-500">طرف مقابل (نام طرف/طرف‌های دعوی - با کاما جدا کنید)</label>
                      <input
                        type="text"
                        value={caseOpposingName}
                        onChange={(e) => setCaseOpposingName(e.target.value)}
                        placeholder="مثال: دادستان عمومی، زهرا علوی..."
                        className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl outline-none focus:ring-1 focus:ring-slate-900 text-xs font-medium"
                      />
                    </div>

                    <div className="space-y-1 col-span-1 sm:col-span-2 lg:col-span-2">
                      <label className="text-slate-500">رمز شخصی سامانه ثنا</label>
                      <input
                        type="text"
                        value={caseSanaPassword}
                        onChange={(e) => setCaseSanaPassword(e.target.value)}
                        placeholder="رمز عبور ثنا"
                        className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl outline-none focus:ring-1 focus:ring-slate-900 text-xs font-medium text-left"
                        dir="ltr"
                      />
                    </div>

                    <div className="space-y-1 col-span-1 sm:col-span-2 lg:col-span-2">
                      <label className="text-slate-500">شماره قرارداد وکالتنامه</label>
                      <input
                        type="text"
                        value={caseContractNo}
                        onChange={(e) => setCaseContractNo(e.target.value)}
                        placeholder="مثال: ۱۴۰۳/۱۲۳۴"
                        className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl outline-none focus:ring-1 focus:ring-slate-900 text-xs font-medium text-left font-mono"
                        dir="ltr"
                      />
                    </div>

                    {/* Associated Persons Section - Touchable Box */}
                    <div className="col-span-1 sm:col-span-2 lg:col-span-4 border-t border-slate-100 pt-3">
                      <div 
                        onClick={() => setShowAssociatedPersonsModal(true)}
                        className="border border-amber-200 bg-amber-50/30 hover:bg-amber-100/40 p-2.5 rounded-xl cursor-pointer transition flex items-center justify-between gap-3 text-amber-900 select-none"
                      >
                        <div className="flex items-center gap-2">
                          <div className="bg-amber-100 p-1.5 rounded-lg text-amber-600">
                            <Users className="w-4 h-4" />
                          </div>
                          <div className="text-right">
                            <p className="font-extrabold text-xs text-slate-800">افراد مرتبط با پرونده</p>
                            <p className="text-[10px] text-slate-400 mt-0.5">ثبت نام و شماره تماس افراد مرتبط</p>
                          </div>
                        </div>
                        <div className="text-left font-sans text-[10px] bg-white px-2 py-1 rounded border border-slate-100 text-slate-600 font-bold max-w-[200px] truncate">
                          {caseAssociatedPersons.length > 0 ? `${toPersianDigits(caseAssociatedPersons.length)} فرد مرتبط ثبت شده` : "تنظیم افراد مرتبط"}
                        </div>
                      </div>
                    </div>
                    
                    {/* مدارک پرونده */}
                    <div className="col-span-1 sm:col-span-2 lg:col-span-2 border-t border-slate-100 pt-3">
                      <div className="space-y-1">
                        <label className="text-slate-500 font-extrabold text-xs">مدارک</label>
                        <p className="text-[10px] text-slate-400 mb-2">مدارک خود را بارگذاری کنید</p>
                        <div className="flex flex-col gap-2">
                          <input 
                            type="file" 
                            multiple 
                            className="text-xs file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-xs file:font-semibold file:bg-amber-50 file:text-amber-700 hover:file:bg-amber-100"
                            onChange={(e) => {
                              if (e.target.files && e.target.files.length > 0) {
                                Array.from(e.target.files).forEach(file => {
                                  const reader = new FileReader();
                                  reader.onload = (event) => {
                                    if (event.target && event.target.result) {
                                      setCaseTempDocs(prev => [...prev, {
                                        name: file.name,
                                        type: file.type.startsWith("image/") ? "image" : file.type.includes("pdf") ? "pdf" : "other",
                                        size: (file.size / 1024).toFixed(1) + " KB",
                                        dataUrl: event.target!.result as string
                                      }]);
                                    }
                                  };
                                  reader.readAsDataURL(file);
                                });
                                e.target.value = '';
                              }
                            }}
                          />
                          {caseTempDocs.length > 0 && (
                            <div className="text-[10px] text-slate-600 font-mono mt-1">
                              {toPersianDigits(caseTempDocs.length)} مدرک آماده بارگذاری
                              <ul className="mt-1 flex flex-col gap-1 max-h-24 overflow-y-auto pr-2 border-r-2 border-slate-200">
                                {caseTempDocs.map((doc, idx) => (
                                  <li key={idx} className="flex justify-between items-center bg-slate-50 p-1 rounded">
                                    <span className="truncate max-w-[200px]">{doc.name}</span>
                                    <button 
                                      type="button" 
                                      onClick={() => setCaseTempDocs(prev => prev.filter((_, i) => i !== idx))}
                                      className="text-red-500 hover:bg-red-50 p-1 rounded"
                                    >✕</button>
                                  </li>
                                ))}
                              </ul>
                            </div>
                          )}
                        </div>
                      </div>
                    </div>

                    {selectedCaseCategory !== 'اظهارنامه' && (
                      <>
                        {/* مرحله رسیدگی */}
                        <div className="space-y-1 col-span-1 sm:col-span-1 lg:col-span-1 relative">
                          <label className="text-slate-500">مرحله رسیدگی</label>
                          <div
                            onClick={() => setShowCaseStagesMenu(!showCaseStagesMenu)}
                            className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl cursor-pointer text-xs font-medium flex justify-between items-center text-slate-800"
                          >
                            <span>{caseStage}</span>
                            <span>▼</span>
                          </div>
                          {showCaseStagesMenu && (
                            <div className="absolute z-20 top-full left-0 sm:left-auto sm:right-0 mt-1 w-[280px] sm:w-[380px] md:w-[440px] bg-white border border-slate-200 rounded-xl shadow-lg p-3 flex flex-col gap-2">
                              {[1, 2, 3, 4, 5].map((num) => {
                                const stageKey = `stage${num}` as const;
                                const archiveKey = `stage${num}ArchiveNumber` as const;
                                return (
                                  <div key={num} className="flex flex-col gap-1 border-b border-slate-100 pb-2 last:border-0 last:pb-0">
                                    <label className="text-[10px] text-slate-500 font-bold">مرحله {num === 1 ? 'اول' : num === 2 ? 'دوم' : num === 3 ? 'سوم' : num === 4 ? 'چهارم' : 'پنجم'}</label>
                                    <div className="grid grid-cols-2 gap-2">
                                      <select
                                        value={caseStages[stageKey] || ''}
                                        onChange={(e) => {
                                          const val = e.target.value as CaseStage;
                                          setCaseStages(prev => ({ ...prev, [stageKey]: val }));
                                          if (val) setCaseStage(val);
                                        }}
                                        className="w-full px-2 py-1.5 bg-slate-50 border border-slate-200 rounded-lg outline-none text-[10px] font-medium"
                                      >
                                        <option value="">انتخاب کنید...</option>
                                        <option value="بدوی">بدوی</option>
                                        <option value="بازپرسی">بازپرسی</option>
                                        <option value="دادیاری">دادیاری</option>
                                        <option value="تجدید نظر استان">تجدید نظر استان</option>
                                        <option value="دیوان عالی کشور">دیوان عالی کشور</option>
                                        <option value="دیوان عدالت اداری">دیوان عدالت اداری</option>
                                        <option value="شورای حل اختلاف">شورای حل اختلاف</option>
                                        <option value="دادگاه صلح">دادگاه صلح</option>
                                        <option value="دادگاه عمومی حقوقی">دادگاه عمومی حقوقی</option>
                                        <option value="دادگاه کیفری ۲">دادگاه کیفری ۲</option>
                                        <option value="اجرای احکام کیفری">اجرای احکام کیفری</option>
                                        <option value="اجرای احکام مدنی">اجرای احکام مدنی</option>
                                        <option value="سایر">سایر</option>
                                      </select>
                                      <input
                                        type="text"
                                        value={caseStages[archiveKey] || ''}
                                        onChange={(e) => {
                                          const val = e.target.value;
                                          setCaseStages(prev => ({ ...prev, [archiveKey]: val }));
                                        }}
                                        placeholder="شماره بایگانی پرونده..."
                                        className="w-full px-2 py-1.5 bg-slate-50 border border-slate-200 rounded-lg outline-none text-[10px] font-medium text-right"
                                      />
                                    </div>
                                  </div>
                                );
                              })}
                              <button
                                type="button"
                                onClick={() => setShowCaseStagesMenu(false)}
                                className="mt-1 w-full bg-slate-900 text-white rounded-lg py-1.5 text-[10px] font-bold hover:bg-slate-800 transition"
                              >
                                تایید و بستن
                              </button>
                            </div>
                          )}
                        </div>

                        {/* شعبه دادگاه */}
                        <div className="space-y-1 col-span-1 sm:col-span-2 lg:col-span-1">
                          <label className="text-slate-500">شعبه دادگاه</label>
                          <input
                            type="text"
                            value={caseBranch}
                            onChange={(e) => setCaseBranch(e.target.value)}
                            placeholder="مثال: شعبه ۱۰ دادگاه عمومی حقوقی..."
                            className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl outline-none focus:ring-1 focus:ring-slate-900 text-xs font-medium"
                          />
                        </div>

                        {/* وضعیت پرونده */}
                        <div className="space-y-1 col-span-1 sm:col-span-2 lg:col-span-1">
                          <label className="text-slate-500">وضعیت فعلی پرونده</label>
                          <select
                            value={caseStatus}
                            onChange={(e) => setCaseStatus(e.target.value as CaseStatus)}
                            className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl outline-none focus:ring-1 focus:ring-slate-900 text-xs font-medium"
                          >
                            <option value="جریان دارد">جریان دارد (سبز)</option>
                            <option value="مختومه">مختومه (قرمز)</option>
                            {selectedCaseCategory !== 'حقوقی' && (
                              <>
                                <option value="منتظر ابلاغ">منتظر ابلاغ (زرد)</option>
                                <option value="در انتظار رای">در انتظار رای (زرد)</option>
                                <option value="تجدیدنظر خواهی">تجدیدنظر خواهی (آبی)</option>
                              </>
                            )}
                          </select>
                        </div>
                      </>
                    )}

                  </div>
                </div>
              )}

              {caseFormStep === 2 && (
                <div className="space-y-4">
                  <div className="grid grid-cols-2 gap-3">
                    <div className="space-y-1">
                      <label className="text-slate-500">کل مبلغ قرارداد وکالت (تومان)</label>
                      <input
                        type="text"
                        value={formatNumberWithSeparator(caseTotalContractAmount)}
                        onChange={(e) => setCaseTotalContractAmount(parseDigits(e.target.value).toString())}
                        placeholder="مثال: ۱۰۰,۰۰۰,۰۰۰"
                        className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl outline-none focus:ring-1 focus:ring-slate-900 font-mono text-xs font-medium"
                      />
                    </div>
                    <div className="space-y-1">
                      <label className="text-slate-500">پیش‌پرداخت قرارداد (تومان)</label>
                      <input
                        type="text"
                        value={formatNumberWithSeparator(caseDownPayment)}
                        onChange={(e) => setCaseDownPayment(parseDigits(e.target.value).toString())}
                        placeholder="مثال: ۲۰,۰۰۰,۰۰۰"
                        className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl outline-none focus:ring-1 focus:ring-slate-900 font-mono text-xs font-medium"
                      />
                    </div>
                  </div>

                  <div className="space-y-4 pt-4 border-t border-slate-100">
                    <div className="flex items-center justify-between">
                      <div>
                        <h4 className="text-[11px] font-black text-amber-700">حق الوکاله دریافتی، هزینه های دادرسی و اضافات</h4>
                        <p className="text-[9px] text-slate-400 font-bold mt-1">امکان ثبت دقیق مبالغ، تاریخ روز، نوع تراکنش، هدایا و اضافات پرداختی</p>
                      </div>
                      <button 
                        type="button" 
                        onClick={() => setCasePayments([...casePayments, { id: "p_" + Date.now(), title: "حق الوکاله", amount: "0", type: "کارت به کارت", date: "", cardNumber: "" }])}
                        className="text-[10px] bg-slate-100 px-3 py-1.5 rounded-lg text-slate-700 font-bold hover:bg-slate-200 cursor-pointer flex gap-1 items-center"
                      >
                        <Plus className="w-3 h-3" /> افزودن پرداختی
                      </button>
                    </div>

                    <div className="space-y-3">
                      {casePayments.map((p, idx) => (
                        <div key={p.id} className="grid grid-cols-1 md:grid-cols-12 gap-2 bg-slate-50 p-3 rounded-2xl border border-slate-150">
                          <div className="md:col-span-2">
                            <input type="text" placeholder="بابت (مثلا حق‌الوکاله یا هدیه)" value={p.title} onChange={(e) => {
                                const newList = [...casePayments];
                                newList[idx].title = e.target.value;
                                setCasePayments(newList);
                            }} className="w-full px-2 py-2 border border-slate-200 rounded-xl outline-none text-xs" />
                          </div>
                          <div className="md:col-span-2">
                             <input type="text" placeholder="مبلغ (تومان)" value={formatNumberWithSeparator(p.amount)} onChange={(e) => {
                                const newList = [...casePayments];
                                newList[idx].amount = parseDigits(e.target.value).toString();
                                setCasePayments(newList);
                            }} className="w-full px-2 py-2 border border-slate-200 rounded-xl outline-none text-xs font-mono" />
                          </div>
                          <div className="md:col-span-2">
                            <select value={p.type} onChange={(e) => {
                                const newList = [...casePayments];
                                newList[idx].type = e.target.value;
                                setCasePayments(newList);
                            }} className="w-full px-2 py-2 border border-slate-200 rounded-xl outline-none text-xs">
                              <option value="کارت به کارت">کارت به کارت</option>
                              <option value="نقدی">نقدی</option>
                              <option value="چک">چک</option>
                              <option value="حواله">حواله</option>
                            </select>
                          </div>
                          <div className="md:col-span-2">
                             <input type="text" placeholder="تاریخ (روز/ماه/سال)" value={p.date} onChange={(e) => {
                                const newList = [...casePayments];
                                newList[idx].date = formatDateWithSlash(e.target.value);
                                setCasePayments(newList);
                            }} className="w-full px-2 py-2 border border-slate-200 rounded-xl outline-none text-xs font-mono" />
                          </div>
                          <div className="md:col-span-3">
                             <input type="text" placeholder="شماره کارت/شبا مقصد (اختیاری)" value={p.cardNumber || ""} onChange={(e) => {
                                const newList = [...casePayments];
                                newList[idx].cardNumber = e.target.value;
                                setCasePayments(newList);
                            }} className="w-full px-2 py-2 border border-slate-200 rounded-xl outline-none text-xs font-mono" />
                          </div>
                          <div className="md:col-span-1 flex items-center justify-center">
                            <button type="button" onClick={() => setCasePayments(casePayments.filter((_, i) => i !== idx))} className="text-red-500 hover:text-red-700 p-1 bg-red-50 rounded-lg cursor-pointer">
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </div>

                          <div className="md:col-span-12 flex flex-wrap items-center gap-4 mt-2 border-t border-slate-200/50 pt-2" dir="rtl">
                            <span className="text-[10px] text-slate-500 font-bold">تصویر رسید / فیش پرداختی:</span>
                            <div className="flex items-center gap-3">
                              <label className="flex items-center gap-1.5 px-3 py-1 bg-amber-50 hover:bg-amber-100 text-amber-700 border border-amber-200 rounded-lg cursor-pointer text-[10px] font-black transition-all select-none">
                                <Camera className="w-3.5 h-3.5" />
                                <span>بارگذاری عکس رسید</span>
                                <input 
                                  type="file" 
                                  accept="image/*" 
                                  className="hidden" 
                                  onChange={(e) => {
                                    const file = e.target.files?.[0];
                                    if (file) {
                                      const reader = new FileReader();
                                      reader.onload = () => {
                                        const newList = [...casePayments];
                                        newList[idx].receiptImage = reader.result as string;
                                        setCasePayments(newList);
                                      };
                                      reader.readAsDataURL(file);
                                    }
                                  }}
                                />
                              </label>
                              {p.receiptImage && (
                                <div className="flex items-center gap-2 bg-emerald-50 border border-emerald-100 px-2 py-0.5 rounded-lg">
                                  <img 
                                    src={p.receiptImage} 
                                    alt="رسید" 
                                    className="w-6 h-6 rounded object-cover cursor-pointer hover:scale-105 transition-all" 
                                    onClick={() => setSelectedReceiptImage(p.receiptImage || null)}
                                    referrerPolicy="no-referrer"
                                  />
                                  <span className="text-[9px] text-emerald-700 font-bold">عکس ثبت شد</span>
                                  <button 
                                    type="button" 
                                    onClick={() => {
                                      const newList = [...casePayments];
                                      newList[idx].receiptImage = undefined;
                                      setCasePayments(newList);
                                    }} 
                                    className="text-red-500 hover:text-red-750 text-[9px] font-extrabold cursor-pointer"
                                  >
                                    حذف
                                  </button>
                                </div>
                              )}
                            </div>
                          </div>
                        </div>
                      ))}
                      {casePayments.length === 0 && <div className="text-center py-4 bg-slate-50/50 rounded-xl border border-dashed border-slate-200 text-slate-400 text-[10px] font-bold">هیچ تراکنشی افزوده نشده است.</div>}
                    </div>
                  </div>

                  {/* Installments section */}
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <label className="text-slate-500">مدیریت اقساط (اختیاری)</label>
                      <button
                        type="button"
                        onClick={() => setCaseInstallments([...caseInstallments, { id: "ins_" + Date.now(), amount: "0", dueDate: "", isPaid: false, paidDate: "", note: "" }])}
                        className="text-[10px] font-bold text-amber-600 hover:text-amber-700 bg-amber-50 px-2 py-1 rounded-lg flex items-center gap-1"
                      >
                        <Plus className="w-3 h-3" /> افزودن قسط
                      </button>
                    </div>
                    {caseInstallments.map((ins, index) => {
                      // simple overdue check
                      const todayStr = new Date().toLocaleDateString("fa-IR", { year: "numeric", month: "2-digit", day: "2-digit" });
                      const d1 = parseDigits(ins.dueDate).toString();
                      const d2 = parseDigits(todayStr).toString();
                      let isOverdue = false;
                      if (!ins.isPaid && d1.length === 8 && d2.length === 8) {
                        isOverdue = parseInt(d1) < parseInt(d2);
                      }

                      return (
                        <div key={index} className={`flex flex-col gap-2.5 p-3 rounded-2xl border ${isOverdue ? 'bg-red-50/50 border-red-200' : 'bg-slate-50 border-slate-150'}`}>
                          <div className="grid grid-cols-1 md:grid-cols-12 gap-2 w-full">
                            <div className="md:col-span-3">
                              <input
                                type="text"
                                placeholder="مبلغ قسط (تومان)"
                                value={formatNumberWithSeparator(ins.amount)}
                                onChange={(e) => {
                                  const newInstallments = [...caseInstallments];
                                  newInstallments[index].amount = parseDigits(e.target.value).toString();
                                  setCaseInstallments(newInstallments);
                                }}
                                className={`w-full px-3 py-2 border rounded-xl outline-none font-mono text-xs font-medium ${isOverdue ? 'bg-white border-red-200 focus:ring-1 focus:ring-red-400' : 'bg-white border-slate-200 focus:ring-1 focus:ring-slate-900'}`}
                              />
                            </div>
                            <div className="md:col-span-3">
                              <input
                                type="text"
                                placeholder="سررسید (پیش‌فرض: ۱۴۰۴/۰۱/۰۱)"
                                value={ins.dueDate}
                                onChange={(e) => {
                                  const newInstallments = [...caseInstallments];
                                  newInstallments[index].dueDate = formatDateWithSlash(e.target.value);
                                  setCaseInstallments(newInstallments);
                                }}
                                className={`w-full px-3 py-2 border rounded-xl outline-none font-mono text-xs font-medium ${isOverdue ? 'bg-white border-red-200 focus:ring-1 focus:ring-red-400' : 'bg-white border-slate-200 focus:ring-1 focus:ring-slate-900'}`}
                              />
                              {isOverdue && <span className="text-[9px] font-black text-red-600 block mt-1 pr-1 flex items-center justify-start gap-1"><AlertCircle className="w-3 h-3" /> معوق (موعد گذشته)</span>}
                            </div>
                            <div className="md:col-span-2 flex flex-col justify-center gap-1">
                              <label className="flex items-center gap-2 cursor-pointer text-xs font-bold text-slate-700 select-none px-2">
                                 <input type="checkbox" checked={ins.isPaid || false} onChange={e => {
                                    const newInstallments = [...caseInstallments];
                                    newInstallments[index].isPaid = e.target.checked;
                                    if (!e.target.checked) {
                                      newInstallments[index].paidDate = "";
                                    } else {
                                      const now = getCurrentJalali();
                                      const todayStr = formatJalaliDate(now.jy, now.jm, now.jd);
                                      newInstallments[index].paidDate = todayStr;
                                      
                                      const newPayment = {
                                        id: "p_" + Date.now(),
                                        title: `دریافت قسط ${toPersianDigits((index + 1).toString())}`,
                                        amount: newInstallments[index].amount,
                                        type: "پرداخت اقساط",
                                        date: todayStr,
                                        cardNumber: ""
                                      };
                                      setCasePayments([...casePayments, newPayment]);
                                    }
                                    setCaseInstallments(newInstallments);
                                  }} className="w-4 h-4 rounded text-amber-500 focus:ring-0 cursor-pointer accent-amber-500" />
                                 پرداخت شد
                              </label>
                            </div>
                            <div className="md:col-span-3">
                              {ins.isPaid && (
                                 <input
                                    type="text"
                                    placeholder="تاریخ دریافت وجه..."
                                    value={ins.paidDate || ""}
                                    onChange={(e) => {
                                      const newInstallments = [...caseInstallments];
                                      newInstallments[index].paidDate = formatDateWithSlash(e.target.value);
                                      setCaseInstallments(newInstallments);
                                    }}
                                    className="w-full px-3 py-2 bg-white border border-green-200 rounded-xl outline-none focus:ring-1 focus:ring-green-500 font-mono text-xs font-medium text-green-700 placeholder-green-300"
                                  />
                              )}
                            </div>
                            <div className="md:col-span-1 flex items-center justify-center">
                              <button type="button" onClick={() => setCaseInstallments(caseInstallments.filter((_, i) => i !== index))} className={`p-1.5 rounded-lg cursor-pointer ${isOverdue ? 'bg-red-100/50 text-red-600 hover:bg-red-100' : 'bg-red-50 text-red-500 hover:bg-red-100'}`}>
                                <Trash2 className="w-4 h-4" />
                              </button>
                            </div>
                          </div>

                          <div className="w-full">
                            <input
                              type="text"
                              placeholder="توضیحات و بابت قسط (مثلاً: قسط دوم حق‌الوکاله، بابت ورود به مرحله تجدیدنظر، چک تضمینی و...)"
                              value={ins.note || ""}
                              onChange={(e) => {
                                const newInstallments = [...caseInstallments];
                                newInstallments[index].note = e.target.value;
                                setCaseInstallments(newInstallments);
                              }}
                              className={`w-full px-3 py-2 border rounded-xl outline-none text-xs font-medium ${isOverdue ? 'bg-white border-red-200 focus:ring-1 focus:ring-red-400' : 'bg-white border-slate-200 focus:ring-1 focus:ring-slate-900'}`}
                            />
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}
              
           <div className="flex gap-2 pt-2">
                {caseFormStep === 1 ? (
                  <>
                    <button type="submit" className="flex-1 py-3 bg-amber-500 hover:bg-amber-600 text-white rounded-xl font-bold transition select-none cursor-pointer">
                      {editingCase ? "ذخیره اطلاعات صفحه" : "ثبت سریع پرونده"}
                    </button>
                    <button type="button" onClick={() => setCaseFormStep(2)} className="flex-1 py-3 bg-indigo-900 hover:bg-slate-900 text-white rounded-xl font-bold transition select-none cursor-pointer">
                      ادامه: ثبت اطلاعات مالی
                    </button>
                  </>
                ) : (
                  <button type="submit" className="flex-1 py-3 bg-slate-900 hover:bg-amber-600 text-white rounded-xl font-bold transition select-none cursor-pointer">
                    {editingCase ? "ذخیره تغییرات پرونده" : "ثبت و برپایی پرونده"}
                  </button>
                )}
                <button type="button" onClick={() => { 
                    if(caseFormStep === 2) setCaseFormStep(1);                
                    else { setShowCaseForm(false); setEditingCase(null); setCaseFormStep(1); }
                }} className="px-5 py-3 bg-slate-100 hover:bg-slate-200 text-slate-600 rounded-xl font-bold transition select-none cursor-pointer">
                    {caseFormStep === 2 ? "بازگشت" : "انصراف"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal 2-B: Set Case Numbers Sub-Modal */}
      {showCaseNumbersModal && (
        <div className="fixed inset-0 bg-slate-900/60 flex items-center justify-center p-4 z-[70] animate-fadeIn backdrop-blur-sm" dir="rtl">
          <div className="bg-white rounded-2xl border border-slate-100 shadow-xl max-w-2xl w-full p-5 space-y-4 text-xs font-bold text-slate-700 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div className="flex flex-col text-right">
                <h3 className="text-sm font-bold text-slate-800 flex items-center gap-2">
                  <Plus className="w-5 h-5 text-amber-500" />
                  تنظیم شماره‌های پرونده
                </h3>
                <span className="text-[10px] text-slate-400 mt-0.5">لطفاً شماره پرونده‌های مربوطه را در فیلدهای زیر وارد نمایید.</span>
              </div>
              <button type="button" onClick={() => setShowCaseNumbersModal(false)} className="text-slate-400 hover:text-slate-600 p-1 cursor-pointer">✕</button>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-right">
              
              <div className="space-y-1 sm:col-span-2">
                <label className="text-slate-500 block">
                  {selectedCaseCategory === 'اظهارنامه' ? 'شماره اظهارنامه *' : 'شماره پرونده ثنا (عدل ایران - ۱۶ الی ۱۸ رقمی) *'}
                </label>
                <input
                  type="text"
                  maxLength={18}
                  value={caseNo}
                  onChange={(e) => setCaseNo(e.target.value)}
                  placeholder="مثلا: ۱۴۰۳۹۸۷۶۵۴۳۲۱۰۰۱"
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl outline-none focus:ring-1 focus:ring-slate-900 font-mono text-xs font-medium text-left"
                  dir="ltr"
                />
              </div>

              <div className="space-y-1">
                <label className="text-slate-500 block">شماره پرونده دادگاه بدوی</label>
                <input
                  type="text"
                  value={courtCaseNo}
                  onChange={(e) => setCourtCaseNo(e.target.value)}
                  placeholder="مثال: ۱۴۰۳۶۸۹۲۰۰"
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl outline-none focus:ring-1 focus:ring-slate-900 font-mono text-xs font-medium text-left"
                  dir="ltr"
                />
              </div>

              <div className="space-y-1">
                <label className="text-slate-500 block">شماره پرونده تجدید نظر</label>
                <input
                  type="text"
                  value={appealCaseNo}
                  onChange={(e) => setAppealCaseNo(e.target.value)}
                  placeholder="مثال: ۱۴۰۳۹۸۷۰۰۰"
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl outline-none focus:ring-1 focus:ring-slate-900 font-mono text-xs font-medium text-left"
                  dir="ltr"
                />
              </div>

              <div className="space-y-1">
                <label className="text-slate-500 block">شماره پرونده واخواهی</label>
                <input
                  type="text"
                  value={rejectionCaseNo}
                  onChange={(e) => setRejectionCaseNo(e.target.value)}
                  placeholder="مثال: ۱۴۰۳۴۵۶۰۰۰"
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl outline-none focus:ring-1 focus:ring-slate-900 font-mono text-xs font-medium text-left"
                  dir="ltr"
                />
              </div>

              <div className="space-y-1">
                <label className="text-slate-500 block">شماره پرونده دیوان عالی / فرجام خواهی</label>
                <input
                  type="text"
                  value={supremeCaseNo}
                  onChange={(e) => setSupremeCaseNo(e.target.value)}
                  placeholder="مثال: ۱۴۰۳۵۶۷۰۰۰"
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl outline-none focus:ring-1 focus:ring-slate-900 font-mono text-xs font-medium text-left"
                  dir="ltr"
                />
              </div>

              <div className="space-y-1">
                <label className="text-slate-500 block">شماره پرونده اجرای احکام کیفری</label>
                <input
                  type="text"
                  value={executionCaseNo}
                  onChange={(e) => setExecutionCaseNo(e.target.value)}
                  placeholder="مثال: ۱۴۰۳۷۸۹۰۰۰"
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl outline-none focus:ring-1 focus:ring-slate-900 font-mono text-xs font-medium text-left"
                  dir="ltr"
                />
              </div>

              <div className="space-y-1">
                <label className="text-slate-500 block">شماره پرونده اجرای احکام مدنی</label>
                <input
                  type="text"
                  value={executionCivilCaseNo}
                  onChange={(e) => setExecutionCivilCaseNo(e.target.value)}
                  placeholder="مثال: ۱۴۰۳۱۲۳۰۰۰"
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl outline-none focus:ring-1 focus:ring-slate-900 font-mono text-xs font-medium text-left"
                  dir="ltr"
                />
              </div>

              <div className="space-y-1">
                <label className="text-slate-500 block">شماره پرونده اعسار</label>
                <input
                  type="text"
                  value={insolvencyCaseNo}
                  onChange={(e) => setInsolvencyCaseNo(e.target.value)}
                  placeholder="مثال: ۱۴۰۳۸۹۰۰۰۰"
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl outline-none focus:ring-1 focus:ring-slate-900 font-mono text-xs font-medium text-left"
                  dir="ltr"
                />
              </div>

              <div className="space-y-1">
                <label className="text-slate-500 block">شماره پرونده بازپرسی</label>
                <input
                  type="text"
                  value={investigationCaseNo}
                  onChange={(e) => setInvestigationCaseNo(e.target.value)}
                  placeholder="مثال: ۱۴۰۳۱۲۳۰۰۱"
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl outline-none focus:ring-1 focus:ring-slate-900 font-mono text-xs font-medium text-left"
                  dir="ltr"
                />
              </div>

              <div className="space-y-1">
                <label className="text-slate-500 block">شماره پرونده دادیاری</label>
                <input
                  type="text"
                  value={prosecutionCaseNo}
                  onChange={(e) => setProsecutionCaseNo(e.target.value)}
                  placeholder="مثال: ۱۴۰۳۱۲۳۰۰۲"
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl outline-none focus:ring-1 focus:ring-slate-900 font-mono text-xs font-medium text-left"
                  dir="ltr"
                />
              </div>

              <div className="space-y-1">
                <label className="text-slate-500 block">کد بایگانی دفتر</label>
                <input
                  type="text"
                  value={caseArchiveNo}
                  onChange={(e) => setCaseArchiveNo(e.target.value)}
                  placeholder="اختیاری"
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl outline-none focus:ring-1 focus:ring-slate-900 font-mono text-xs font-medium text-left"
                  dir="ltr"
                />
              </div>

            </div>

            <div className="flex justify-end gap-2 pt-4 border-t border-slate-100">
              <button
                type="button"
                onClick={() => {
                  setShowCaseNumbersModal(false);
                }}
                className="px-6 py-2 bg-amber-600 text-white rounded-xl hover:bg-amber-700 font-bold transition cursor-pointer text-xs select-none"
              >
                تایید و ثبت شماره‌ها
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal 2-C: Set Associated Persons Sub-Modal */}
      {showAssociatedPersonsModal && (
        <div className="fixed inset-0 bg-slate-900/60 flex items-center justify-center p-4 z-[70] animate-fadeIn backdrop-blur-sm" dir="rtl">
          <div className="bg-white rounded-2xl border border-slate-100 shadow-xl max-w-2xl w-full p-5 space-y-4 text-xs font-bold text-slate-700 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div className="flex flex-col text-right">
                <h3 className="text-sm font-bold text-slate-800 flex items-center gap-2">
                  <Users className="w-5 h-5 text-amber-500" />
                  افراد مرتبط با پرونده
                </h3>
                <span className="text-[10px] text-slate-400 mt-0.5">ثبت اطلاعات نام و شماره تماس افراد مرتبط با پرونده (شهود، مطلعین و...)</span>
              </div>
              <button type="button" onClick={() => setShowAssociatedPersonsModal(false)} className="text-slate-400 hover:text-slate-600 p-1 cursor-pointer">✕</button>
            </div>

            <div className="space-y-3 text-right">
              {caseAssociatedPersons.length === 0 ? (
                <div className="text-center py-6 border-2 border-dashed border-slate-100 rounded-xl text-slate-400 font-medium">
                  هیچ فرد مرتبطی ثبت نشده است. برای افزودن دکمه زیر را فشار دهید.
                </div>
              ) : (
                <div className="space-y-2">
                  {caseAssociatedPersons.map((p, idx) => (
                    <div key={idx} className="flex gap-2 items-center bg-slate-50/50 p-2 rounded-xl border border-slate-100">
                      <div className="flex-1 space-y-1">
                        <label className="text-[10px] text-slate-400 block pr-1">نام و نام خانوادگی</label>
                        <input 
                          type="text" 
                          placeholder="مثال: علی احمدی" 
                          value={p.name} 
                          onChange={(e) => {
                            const newList = [...caseAssociatedPersons];
                            newList[idx].name = e.target.value;
                            setCaseAssociatedPersons(newList);
                          }} 
                          className="w-full px-3 py-2 bg-white border border-slate-200 rounded-lg outline-none focus:ring-1 focus:ring-slate-900 text-xs font-bold" 
                        />
                      </div>
                      <div className="flex-1 space-y-1">
                        <label className="text-[10px] text-slate-400 block pr-1">شماره تماس</label>
                        <input 
                          type="text" 
                          placeholder="مثال: ۰۹۱۲۳۴۵۶۷۸۹" 
                          value={p.phone} 
                          onChange={(e) => {
                            const newList = [...caseAssociatedPersons];
                            newList[idx].phone = e.target.value;
                            setCaseAssociatedPersons(newList);
                          }} 
                          className="w-full px-3 py-2 bg-white border border-slate-200 rounded-lg outline-none focus:ring-1 focus:ring-slate-900 text-xs font-mono font-medium text-left" 
                          dir="ltr"
                        />
                      </div>
                      <div className="pt-5">
                        <button 
                          type="button" 
                          onClick={() => setCaseAssociatedPersons(caseAssociatedPersons.filter((_, i) => i !== idx))} 
                          className="text-red-500 hover:text-red-700 p-2 cursor-pointer bg-red-50 hover:bg-red-100 rounded-lg transition"
                        >
                          ✕
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}

              <button 
                type="button" 
                onClick={() => setCaseAssociatedPersons([...caseAssociatedPersons, { name: "", phone: "" }])} 
                className="text-xs bg-slate-100 px-4 py-2 rounded-xl text-slate-700 font-bold hover:bg-slate-200 cursor-pointer w-full flex items-center justify-center gap-1 transition"
              >
                <Plus className="w-4 h-4" />
                افزودن فرد مرتبط جدید
              </button>
            </div>

            <div className="flex justify-end gap-2 pt-4 border-t border-slate-100">
              <button
                type="button"
                onClick={() => setShowAssociatedPersonsModal(false)}
                className="px-6 py-2 bg-amber-600 text-white rounded-xl hover:bg-amber-700 font-bold transition cursor-pointer text-xs select-none"
              >
                تایید و ذخیره لیست
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal 2-D: Set Case Dates Sub-Modal */}
      {showCaseDatesModal && (
        <div className="fixed inset-0 bg-slate-900/60 flex items-center justify-center p-4 z-[70] animate-fadeIn backdrop-blur-sm" dir="rtl">
          <div className="bg-white rounded-2xl border border-slate-100 shadow-xl max-w-sm w-full p-5 space-y-4 text-xs font-bold text-slate-700">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div className="flex flex-col text-right">
                <h3 className="text-sm font-bold text-slate-800 flex items-center gap-2">
                  <Calendar className="w-5 h-5 text-amber-500" />
                  سابقه تاریخ پرونده
                </h3>
                <span className="text-[10px] text-slate-400 mt-0.5">ثبت تاریخ‌های مربوط به این پرونده</span>
              </div>
              <button type="button" onClick={() => setShowCaseDatesModal(false)} className="text-slate-400 hover:text-slate-600 p-1 cursor-pointer">✕</button>
            </div>

            <div className="space-y-4 text-right">
              <div className="space-y-1">
                <label className="text-slate-500 block">تاریخ ثبت پرونده در دادگستری</label>
                <input
                  type="text"
                  placeholder="مثال: ۱۴۰۳/۰۱/۰۱"
                  value={caseCourtRegistrationDate}
                  onChange={(e) => setCaseCourtRegistrationDate(formatDateWithSlash(e.target.value))}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl outline-none focus:ring-1 focus:ring-slate-900 font-mono text-xs font-medium text-left"
                  dir="ltr"
                />
              </div>

              <div className="space-y-1">
                <label className="text-slate-500 block">تاریخ تشکیل پرونده در این سامانه</label>
                <input
                  type="text"
                  placeholder="مثال: ۱۴۰۳/۰۱/۰۱"
                  value={caseFilingDate}
                  onChange={(e) => setCaseFilingDate(formatDateWithSlash(e.target.value))}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl outline-none focus:ring-1 focus:ring-slate-900 font-mono text-xs font-medium text-left"
                  dir="ltr"
                />
              </div>

              <div className="space-y-1">
                <label className="text-slate-500 block">تاریخ اخذ وکالت از موکل</label>
                <input
                  type="text"
                  placeholder="مثال: ۱۴۰۳/۰۱/۰۱"
                  value={casePowerOfAttorneyDate}
                  onChange={(e) => setCasePowerOfAttorneyDate(formatDateWithSlash(e.target.value))}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl outline-none focus:ring-1 focus:ring-slate-900 font-mono text-xs font-medium text-left"
                  dir="ltr"
                />
              </div>

              <div className="space-y-1">
                <label className="text-slate-500 block">تاریخ مختومه شدن پرونده</label>
                <input
                  type="text"
                  placeholder="مثال: ۱۴۰۳/۰۱/۰۱"
                  value={caseClosedDate}
                  onChange={(e) => setCaseClosedDate(formatDateWithSlash(e.target.value))}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl outline-none focus:ring-1 focus:ring-slate-900 font-mono text-xs font-medium text-left"
                  dir="ltr"
                />
              </div>
            </div>

            <div className="flex justify-end gap-2 pt-4 border-t border-slate-100">
              <button
                type="button"
                onClick={() => setShowCaseDatesModal(false)}
                className="px-6 py-2 bg-amber-600 text-white rounded-xl hover:bg-amber-700 font-bold transition cursor-pointer text-xs select-none w-full"
              >
                تایید
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal 3-B: Printable Case View */}
      {printableCase && (
        <div className="fixed inset-0 bg-slate-900/80 flex items-center justify-center p-4 z-50 animate-fadeIn backdrop-blur-sm overflow-y-auto">
          <div className="bg-white rounded-3xl shadow-2xl max-w-4xl w-full p-8 font-sans text-right" dir="rtl">
            
            {/* Modal Header */}
            <div className="border-b border-slate-100 pb-4 mb-6 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
              <div className="flex items-center gap-3">
                <div className="p-3 bg-amber-50 text-amber-600 rounded-2xl border border-amber-100 shadow-sm shrink-0">
                  <Folder className="w-6 h-6" />
                </div>
                <div>
                  <h2 className="text-sm font-black text-slate-850">
                    پرونده: <span className="text-blue-600 font-extrabold">{toPersianDigits(printableCase.title)}</span>
                  </h2>
                  <p className="text-[10px] text-slate-400 mt-1">جهت مشاهده اطلاعات مربوط به هر بخش، روی آن کلیک کنید</p>
                </div>
              </div>
              {previewSubPage !== 3 && (
                <div className="text-left">
                  <span className="text-[10px] bg-slate-100 text-slate-600 px-3 py-1 rounded-full font-mono font-bold">
                    {printableCase.category === 'اظهارنامه' ? 'شماره اظهارنامه:' : 'شماره پرونده:'} {toPersianDigits(printableCase.caseNumber)}
                  </span>
                </div>
              )}
            </div>

            {/* Main Interactive Views */}
            {previewSubPage === null ? (
              /* Option Hub (Main Menu) */
              <div className="space-y-6">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {/* ۱. مشخصات هویتی موکل */}
                  <div 
                    onClick={() => setPreviewSubPage(1)}
                    className="p-5 rounded-2xl border border-slate-150 bg-slate-50/50 hover:bg-amber-50/20 hover:border-amber-200 cursor-pointer transition-all duration-200 group flex items-start gap-4 shadow-sm hover:shadow-md select-none"
                  >
                    <div className="p-3 bg-blue-50 text-blue-600 rounded-xl group-hover:bg-blue-100 transition-all">
                      <User className="w-5 h-5" />
                    </div>
                    <div className="flex-1 text-right">
                      <h4 className="text-xs font-black text-slate-800 group-hover:text-blue-700 transition">۱. مشخصات هویتی موکل</h4>
                      <p className="text-[10px] text-slate-400 mt-1.5 leading-relaxed">مشاهده کدملی، شماره همراه، اطلاعات پایه و سوابق هویتی موکل پرونده</p>
                    </div>
                  </div>

                  {/* ۲. اطلاعات پرونده */}
                  <div 
                    onClick={() => setPreviewSubPage(2)}
                    className="p-5 rounded-2xl border border-slate-150 bg-slate-50/50 hover:bg-amber-50/20 hover:border-amber-200 cursor-pointer transition-all duration-200 group flex items-start gap-4 shadow-sm hover:shadow-md select-none"
                  >
                    <div className="p-3 bg-indigo-50 text-indigo-600 rounded-xl group-hover:bg-indigo-100 transition-all">
                      <Briefcase className="w-5 h-5" />
                    </div>
                    <div className="flex-1 text-right">
                      <h4 className="text-xs font-black text-slate-800 group-hover:text-indigo-700 transition">۲. اطلاعات پرونده</h4>
                      <p className="text-[10px] text-slate-400 mt-1.5 leading-relaxed">مشاهده شماره پرونده ثنا، شعبه دادگاه، خواسته، شاکی/متهم و کلاسه بایگانی</p>
                    </div>
                  </div>

                  {/* ۳. وضعیت مالی و قرارداد */}
                  <div 
                    onClick={() => setPreviewSubPage(3)}
                    className="p-5 rounded-2xl border border-slate-150 bg-slate-50/50 hover:bg-amber-50/20 hover:border-amber-200 cursor-pointer transition-all duration-200 group flex items-start gap-4 shadow-sm hover:shadow-md select-none"
                  >
                    <div className="p-3 bg-emerald-50 text-emerald-600 rounded-xl group-hover:bg-emerald-100 transition-all">
                      <Coins className="w-5 h-5" />
                    </div>
                    <div className="flex-1 text-right">
                      <h4 className="text-xs font-black text-slate-800 group-hover:text-emerald-700 transition">۳. وضعیت مالی و قرارداد</h4>
                      <p className="text-[10px] text-slate-400 mt-1.5 leading-relaxed">تراز حق‌الوکاله، هزینه‌های دادرسی، پرداخت پیش‌پرداخت، مبالغ اقساط و تراکنش‌ها</p>
                    </div>
                  </div>

                  {/* ۴. افراد مرتبط با پرونده */}
                  <div 
                    onClick={() => setPreviewSubPage(4)}
                    className="p-5 rounded-2xl border border-slate-150 bg-slate-50/50 hover:bg-amber-50/20 hover:border-amber-200 cursor-pointer transition-all duration-200 group flex items-start gap-4 shadow-sm hover:shadow-md select-none"
                  >
                    <div className="p-3 bg-amber-50 text-amber-600 rounded-xl group-hover:bg-amber-100 transition-all">
                      <Users className="w-5 h-5" />
                    </div>
                    <div className="flex-1 text-right">
                      <h4 className="text-xs font-black text-slate-800 group-hover:text-amber-700 transition">۴. افراد مرتبط با پرونده</h4>
                      <p className="text-[10px] text-slate-400 mt-1.5 leading-relaxed">اسامی شهود، کارشناسان، اعضای خانواده، وکلا و افراد ذی‌ربط همراه تلفن تماس</p>
                    </div>
                  </div>

                  {/* ۵. شرح خلاصه پرونده */}
                  {hasValue(printableCase.description) && (
                    <div 
                      onClick={() => setPreviewSubPage(5)}
                      className="p-5 rounded-2xl border border-slate-150 bg-slate-50/50 hover:bg-amber-50/20 hover:border-amber-200 cursor-pointer transition-all duration-200 group flex items-start gap-4 shadow-sm hover:shadow-md select-none sm:col-span-2"
                    >
                      <div className="p-3 bg-teal-50 text-teal-600 rounded-xl group-hover:bg-teal-100 transition-all">
                        <FileText className="w-5 h-5" />
                      </div>
                      <div className="flex-1 text-right">
                        <h4 className="text-xs font-black text-slate-800 group-hover:text-teal-700 transition">۵. شرح خلاصه و مبانی وضعیت پرونده</h4>
                        <p className="text-[10px] text-slate-400 mt-1.5 leading-relaxed">مشاهده چکیده وضعیت پرونده، صورت‌جلسه دفاعیه و یادداشت اقدامات کلیدی انجام‌شده</p>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            ) : previewSubPage === 1 ? (
              /* Sub-page 1: Client Identity */
              <div className="space-y-4 animate-fadeIn">
                <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                  <h3 className="text-xs font-extrabold text-slate-800 flex items-center gap-2">
                    <span className="w-6 h-6 rounded-full bg-blue-50 text-blue-600 flex items-center justify-center text-[10px] font-black">۱</span>
                    مشخصات هویتی موکل
                  </h3>
                  <button 
                    onClick={() => setPreviewSubPage(null)} 
                    className="px-3 py-1 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg text-[10px] font-bold transition flex items-center gap-1 cursor-pointer"
                  >
                    <ArrowLeft className="w-3.5 h-3.5" />
                    بازگشت به منو
                  </button>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 border border-slate-200 p-6 rounded-2xl text-xs bg-slate-50/30">
                  {hasValue(printableCase.clientName) && (
                    <p className="text-slate-700"><strong>نام موکل:</strong> <span className="text-blue-600 font-semibold">{printableCase.clientName}</span></p>
                  )}
                  {hasValue(printableCase.clientRole) && (
                    <p className="text-slate-700"><strong>نقش موکل:</strong> <span className="text-blue-600 font-semibold">{printableCase.clientRole}</span></p>
                  )}
                  {(() => {
                    const cl = clients.find(cl => cl.id === printableCase.clientId);
                    if (!cl) return null;
                    return (
                      <>
                        {cl.phoneNumber && (
                          <p className="text-slate-700"><strong>تلفن همراه:</strong> <span className="text-blue-600 font-semibold font-mono">{toPersianDigits(cl.phoneNumber)}</span></p>
                        )}
                        {cl.nationalId && (
                          <p className="text-slate-700"><strong>کد ملی:</strong> <span className="text-blue-600 font-semibold font-mono">{toPersianDigits(cl.nationalId)}</span></p>
                        )}
                        {cl.birthDate && (
                          <p className="text-slate-700"><strong>تاریخ تولد:</strong> <span className="text-blue-600 font-semibold font-mono">{toPersianDigits(cl.birthDate)}</span></p>
                        )}
                        {cl.fatherName && (
                          <p className="text-slate-700"><strong>نام پدر:</strong> <span className="text-blue-600 font-semibold">{toPersianDigits(cl.fatherName)}</span></p>
                        )}
                        {cl.address && (
                          <p className="text-slate-700 sm:col-span-2"><strong>نشانی محل سکونت / کار:</strong> <span className="text-blue-600 font-semibold">{toPersianDigits(cl.address)}</span></p>
                        )}
                        {cl.description && (
                          <p className="text-slate-700 sm:col-span-2"><strong>یادداشت پرونده موکل:</strong> <span className="text-blue-600 font-semibold">{toPersianDigits(cl.description)}</span></p>
                        )}
                      </>
                    );
                  })()}
                </div>
              </div>
            ) : previewSubPage === 2 ? (
              /* Sub-page 2: Case Details */
              <div className="space-y-4 animate-fadeIn">
                <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                  <h3 className="text-xs font-extrabold text-slate-800 flex items-center gap-2">
                    <span className="w-6 h-6 rounded-full bg-indigo-50 text-indigo-600 flex items-center justify-center text-[10px] font-black">۲</span>
                    اطلاعات پرونده
                  </h3>
                  <button 
                    onClick={() => setPreviewSubPage(null)} 
                    className="px-3 py-1 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg text-[10px] font-bold transition flex items-center gap-1 cursor-pointer"
                  >
                    <ArrowLeft className="w-3.5 h-3.5" />
                    بازگشت به منو
                  </button>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 border border-slate-200 p-6 rounded-2xl text-xs bg-slate-50/30">
                  {hasValue(printableCase.title) && (
                    <p className="text-slate-700"><strong>موضوع پرونده (خواسته):</strong> <span className="text-blue-600 font-semibold">{toPersianDigits(printableCase.title)}</span></p>
                  )}
                  {hasValue(printableCase.caseNumber) && (
                    <p className="text-slate-700"><strong>{printableCase.category === 'اظهارنامه' ? 'شماره اظهارنامه' : 'شماره پرونده (ثنا)'}:</strong> <span className="text-blue-600 font-semibold font-mono">{toPersianDigits(printableCase.caseNumber)}</span></p>
                  )}
                  {hasValue(printableCase.declarationTrackingCode) && (
                    <p className="text-slate-700"><strong>کد رهگیری اظهارنامه:</strong> <span className="text-blue-600 font-semibold font-mono">{toPersianDigits(printableCase.declarationTrackingCode)}</span></p>
                  )}
                  {hasValue(printableCase.declarationSendDate) && (
                    <p className="text-slate-700"><strong>تاریخ ارسال اظهارنامه:</strong> <span className="text-blue-600 font-semibold font-mono">{toPersianDigits(printableCase.declarationSendDate)}</span> {printableCase.declarationSendGracePeriod && <span className="text-amber-600 font-bold">({toPersianDigits(printableCase.declarationSendGracePeriod)} روز مهلت)</span>}</p>
                  )}
                  {hasValue(printableCase.declarationReceiveDate) && (
                    <p className="text-slate-700"><strong>تاریخ دریافت اظهارنامه:</strong> <span className="text-blue-600 font-semibold font-mono">{toPersianDigits(printableCase.declarationReceiveDate)}</span> {printableCase.declarationReceiveGracePeriod && <span className="text-amber-600 font-bold">({toPersianDigits(printableCase.declarationReceiveGracePeriod)} روز مهلت)</span>}</p>
                  )}
                  {hasValue(printableCase.branch) && (
                    <p className="text-slate-700"><strong>شعبه دادگاه:</strong> <span className="text-blue-600 font-semibold">{toPersianDigits(printableCase.branch)}</span></p>
                  )}
                  {hasValue(printableCase.sanaPassword) && (
                    <p className="text-slate-700"><strong>رمز شخصی ثنا:</strong> <span className="text-blue-600 font-semibold font-mono">{printableCase.sanaPassword}</span></p>
                  )}
                  {hasValue(printableCase.contractNumber) && (
                    <p className="text-slate-700"><strong>شماره قرارداد وکالتنامه:</strong> <span className="text-blue-600 font-semibold font-mono">{toPersianDigits(printableCase.contractNumber)}</span></p>
                  )}
                  {hasValue(printableCase.opposingPartyName) && (
                    <p className="text-slate-700"><strong>طرف مقابل پرونده:</strong> <span className="text-blue-600 font-semibold">{printableCase.opposingPartyName}</span></p>
                  )}
                  {hasValue(printableCase.filingDate) && (
                    <p className="text-slate-700"><strong>تاریخ تشکیل در سامانه:</strong> <span className="text-blue-600 font-semibold font-mono">{toPersianDigits(printableCase.filingDate)}</span></p>
                  )}
                  {hasValue(printableCase.courtRegistrationDate) && (
                    <p className="text-slate-700"><strong>تاریخ ثبت دادگستری:</strong> <span className="text-blue-600 font-semibold font-mono">{toPersianDigits(printableCase.courtRegistrationDate)}</span></p>
                  )}
                  {hasValue(printableCase.powerOfAttorneyDate) && (
                    <p className="text-slate-700"><strong>تاریخ اخذ وکالت:</strong> <span className="text-blue-600 font-semibold font-mono">{toPersianDigits(printableCase.powerOfAttorneyDate)}</span></p>
                  )}
                  {hasValue(printableCase.closedDate) && (
                    <p className="text-slate-700"><strong>تاریخ مختومه شدن:</strong> <span className="text-blue-600 font-semibold font-mono">{toPersianDigits(printableCase.closedDate)}</span></p>
                  )}
                  {hasValue(printableCase.createdAt) && (
                    <p className="text-slate-700"><strong>تاریخ ثبت پرونده:</strong> <span className="text-blue-600 font-semibold font-mono">{toPersianDigits(printableCase.createdAt)}</span></p>
                  )}
                  {hasValue(printableCase.stage) && (
                    <p className="text-slate-700"><strong>مرحلۀ پرونده:</strong> <span className="text-blue-600 font-semibold">{printableCase.stage}</span></p>
                  )}
                  {hasValue(printableCase.status) && (
                    <p className="text-slate-700"><strong>وضعیت پرونده:</strong> <span className="text-blue-600 font-semibold">{printableCase.status}</span></p>
                  )}
                  {hasValue(printableCase.courtCaseNumber) && (
                    <p className="text-slate-700"><strong>شماره دادگاه بدوی:</strong> <span className="text-blue-600 font-semibold font-mono">{toPersianDigits(printableCase.courtCaseNumber)}</span></p>
                  )}
                  {hasValue(printableCase.archiveNumber) && (
                    <p className="text-slate-700"><strong>کلاسه بایگانی دفتر:</strong> <span className="text-blue-600 font-semibold font-mono">{toPersianDigits(printableCase.archiveNumber)}</span></p>
                  )}
                  {hasValue(printableCase.appealCaseNumber) && (
                    <p className="text-slate-700"><strong>شماره تجدید نظر:</strong> <span className="text-blue-600 font-semibold font-mono">{toPersianDigits(printableCase.appealCaseNumber)}</span></p>
                  )}
                  {hasValue(printableCase.rejectionCaseNumber) && (
                    <p className="text-slate-700"><strong>شماره واخواهی:</strong> <span className="text-blue-600 font-semibold font-mono">{toPersianDigits(printableCase.rejectionCaseNumber)}</span></p>
                  )}
                  {hasValue(printableCase.supremeCaseNumber) && (
                    <p className="text-slate-700"><strong>فرجام خواهی/دیوان:</strong> <span className="text-blue-600 font-semibold font-mono">{toPersianDigits(printableCase.supremeCaseNumber)}</span></p>
                  )}
                  {hasValue(printableCase.executionCaseNumber) && (
                    <p className="text-slate-700"><strong>اجرای احکام کیفری:</strong> <span className="text-blue-600 font-semibold font-mono">{toPersianDigits(printableCase.executionCaseNumber)}</span></p>
                  )}
                  {hasValue(printableCase.executionCivilCaseNumber) && (
                    <p className="text-slate-700"><strong>اجرای احکام مدنی:</strong> <span className="text-blue-600 font-semibold font-mono">{toPersianDigits(printableCase.executionCivilCaseNumber)}</span></p>
                  )}
                  {hasValue(printableCase.insolvencyCaseNumber) && (
                    <p className="text-slate-700"><strong>شماره پرونده اعسار:</strong> <span className="text-blue-600 font-semibold font-mono">{toPersianDigits(printableCase.insolvencyCaseNumber)}</span></p>
                  )}
                  {hasValue(printableCase.investigationCaseNumber) && (
                    <p className="text-slate-700"><strong>شماره پرونده بازپرسی:</strong> <span className="text-blue-600 font-semibold font-mono">{toPersianDigits(printableCase.investigationCaseNumber)}</span></p>
                  )}
                  {hasValue(printableCase.prosecutionCaseNumber) && (
                    <p className="text-slate-700"><strong>شماره پرونده دادیاری:</strong> <span className="text-blue-600 font-semibold font-mono">{toPersianDigits(printableCase.prosecutionCaseNumber)}</span></p>
                  )}
                </div>
              </div>
            ) : previewSubPage === 3 ? (
              /* Sub-page 3: Finance & Payments */
              <div className="space-y-4 animate-fadeIn">
                <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                  <h3 className="text-xs font-extrabold text-slate-800 flex items-center gap-2">
                    <span className="w-6 h-6 rounded-full bg-emerald-50 text-emerald-600 flex items-center justify-center text-[10px] font-black">۳</span>
                    وضعیت مالی و قرارداد
                  </h3>
                  <button 
                    onClick={() => setPreviewSubPage(null)} 
                    className="px-3 py-1 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg text-[10px] font-bold transition flex items-center gap-1 cursor-pointer"
                  >
                    <ArrowLeft className="w-3.5 h-3.5" />
                    بازگشت به منو
                  </button>
                </div>

                {/* Print confirmation block */}
                <div className="bg-slate-50 border border-slate-200 p-2.5 rounded-2xl flex flex-col sm:flex-row items-center justify-between gap-4">
                  <span className="text-[11px] font-bold text-slate-700">آیا اطلاعات مالی جهت چاپ نمایش داده شود؟</span>
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => setIncludeFinancialInPrint(true)}
                      className={`px-4 py-1.5 rounded-xl text-[10px] font-extrabold transition-all cursor-pointer ${
                        includeFinancialInPrint
                          ? "bg-amber-500 text-white shadow-sm"
                          : "bg-white border border-slate-200 text-slate-600 hover:bg-slate-100"
                      }`}
                    >
                      بله (نمایش در چاپ)
                    </button>
                    <button
                      type="button"
                      onClick={() => setIncludeFinancialInPrint(false)}
                      className={`px-4 py-1.5 rounded-xl text-[10px] font-extrabold transition-all cursor-pointer ${
                        !includeFinancialInPrint
                          ? "bg-slate-300 text-slate-800 shadow-sm"
                          : "bg-white border border-slate-200 text-slate-600 hover:bg-slate-100"
                      }`}
                    >
                      خیر (پنهان در چاپ)
                    </button>
                  </div>
                </div>

                {/* Total Fee Card */}
                <div className="mt-4 border border-emerald-200 p-4 rounded-2xl bg-emerald-50 flex items-center justify-between">
                  <span className="text-xs font-bold text-emerald-800">مبلغ کل حق‌الوکاله</span>
                  <span className="text-emerald-950 font-black text-xs">
                    {hasValue(printableCase.totalContractAmount) 
                      ? `${toPersianDigits((printableCase.totalContractAmount ?? 0).toLocaleString())} تومان`
                      : "۰ تومان"}
                  </span>
                </div>

                {/* Installments Block */}
                {printableCase.installments && printableCase.installments.length > 0 && (
                  <div className="mt-4 border border-slate-200 rounded-2xl max-h-60 overflow-y-auto">
                    <div className="bg-slate-50 px-4 py-2 border-b border-slate-200 sticky top-0">
                      <h4 className="text-[11px] font-black text-slate-700">اقساط تعیین شده</h4>
                    </div>
                    <table className="w-full text-right text-xs border-collapse" dir="rtl">
                      <thead>
                        <tr className="bg-slate-50/50 font-bold text-slate-600 border-b border-slate-200">
                          <th className="p-3 border-l border-slate-150 text-center w-12">ردیف</th>
                          <th className="p-3 border-l border-slate-150">مبلغ قسط</th>
                          <th className="p-3 border-l border-slate-150">تاریخ سررسید</th>
                          <th className="p-3 border-l border-slate-150">بابت / توضیحات</th>
                          <th className="p-3">وضعیت پرداخت</th>
                        </tr>
                      </thead>
                      <tbody>
                        {printableCase.installments.map((ins, idx) => (
                          <tr key={idx} className="border-b border-slate-100 last:border-0 hover:bg-slate-50/50">
                            <td className="p-3 border-l border-slate-100 text-slate-500 font-mono text-[10px] text-center">{toPersianDigits(idx + 1)}</td>
                            <td className="p-3 border-l border-slate-100 text-blue-600 font-semibold">{toPersianDigits((ins.amount ?? 0).toLocaleString())} تومان</td>
                            <td className="p-3 border-l border-slate-100 text-slate-600 font-mono">{toPersianDigits(ins.dueDate)}</td>
                            <td className="p-3 border-l border-slate-100 text-slate-600 font-sans text-[11px]">{ins.note || "-"}</td>
                            <td className="p-3">
                              {ins.isPaid ? (
                                <span className="inline-flex items-center px-1.5 py-0.5 rounded bg-green-50 border border-green-200 text-[10px] font-bold text-green-600">
                                  پرداخت شده {ins.paidDate ? `(در ` + toPersianDigits(ins.paidDate) + `)` : ``}
                                </span>
                              ) : (
                                <span className="inline-flex items-center px-1.5 py-0.5 rounded bg-red-50 border border-red-200 text-[10px] font-bold text-red-600">
                                  معوق / در انتظار پرداخت
                                </span>
                              )}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}

                {/* Transactions Block with Image Attachments Display! */}
                {printableCase.payments && printableCase.payments.length > 0 && (
                  <div className="mt-4 overflow-hidden border border-slate-200 rounded-2xl">
                    <div className="bg-slate-50 px-4 py-3 border-b border-slate-200">
                      <h4 className="text-[11px] font-black text-slate-700">تاریخچه تراکنش‌ها</h4>
                    </div>
                    <table className="w-full text-right text-xs border-collapse" dir="rtl">
                      <thead>
                        <tr className="bg-slate-50/50 font-bold text-slate-600 border-b border-slate-200">
                          <th className="p-3 border-l border-slate-150 text-center w-12">ردیف</th>
                          <th className="p-3 border-l border-slate-150">بابت / شرح</th>
                          <th className="p-3 border-l border-slate-150">مبلغ دریافتی</th>
                          <th className="p-3 border-l border-slate-150">نوع پرداخت</th>
                          <th className="p-3 border-l border-slate-150">تاریخ پرداخت</th>
                          <th className="p-3">تصویر رسید پرداختی</th>
                        </tr>
                      </thead>
                      <tbody>
                        {printableCase.payments.map((p, idx) => (
                          <tr key={p.id || idx} className="border-b border-slate-100 last:border-0 hover:bg-slate-50/50">
                            <td className="p-3 border-l border-slate-100 text-slate-500 font-mono text-[10px] text-center">{toPersianDigits(idx + 1)}</td>
                            <td className="p-3 border-l border-slate-100 text-slate-700 font-bold">{p.title}</td>
                            <td className="p-3 border-l border-slate-100 text-green-600 font-bold">{toPersianDigits((p.amount ?? 0).toLocaleString())} تومان</td>
                            <td className="p-3 border-l border-slate-100 text-slate-600">{p.type}</td>
                            <td className="p-3 border-l border-slate-100 font-mono text-slate-600">{toPersianDigits(p.date)}</td>
                            <td className="p-3">
                              {p.receiptImage ? (
                                <div className="flex items-center gap-2">
                                  <img 
                                    src={p.receiptImage} 
                                    alt="رسید" 
                                    onClick={() => setSelectedReceiptImage(p.receiptImage || null)}
                                    className="w-10 h-10 object-cover rounded-lg border border-slate-200 cursor-zoom-in hover:scale-105 transition-all shadow-sm" 
                                    referrerPolicy="no-referrer"
                                  />
                                  <span className="text-[10px] text-emerald-600 font-bold cursor-zoom-in">دیدن رسید</span>
                                </div>
                              ) : (
                                <span className="text-[10px] text-slate-400 font-bold">فاقد تصویر رسید</span>
                              )}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            ) : previewSubPage === 4 ? (
              /* Sub-page 4: Associated Persons */
              <div className="space-y-4 animate-fadeIn">
                <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                  <h3 className="text-xs font-extrabold text-slate-800 flex items-center gap-2">
                    <span className="w-6 h-6 rounded-full bg-amber-50 text-amber-600 flex items-center justify-center text-[10px] font-black">۴</span>
                    افراد مرتبط با پرونده
                  </h3>
                  <button 
                    onClick={() => setPreviewSubPage(null)} 
                    className="px-3 py-1 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg text-[10px] font-bold transition flex items-center gap-1 cursor-pointer"
                  >
                    <ArrowLeft className="w-3.5 h-3.5" />
                    بازگشت به منو
                  </button>
                </div>

                {printableCase.associatedPersons && printableCase.associatedPersons.length > 0 ? (
                  <table className="w-full border-collapse border border-slate-200 text-xs text-right rounded-2xl overflow-hidden" dir="rtl">
                    <thead>
                      <tr className="bg-slate-100 font-bold text-slate-700">
                        <th className="border border-slate-200 p-3 text-right">نام و نام خانوادگی</th>
                        <th className="border border-slate-200 p-3 text-right">شماره تماس (تلفن همراه)</th>
                      </tr>
                    </thead>
                    <tbody>
                      {printableCase.associatedPersons.map((person, i) => (
                        <tr key={i} className="hover:bg-slate-50/50 transition">
                          <td className="border border-slate-200 p-3 text-blue-600 font-semibold">{person.name || "-"}</td>
                          <td className="border border-slate-200 p-3 font-mono text-blue-600 font-semibold">{person.phone ? toPersianDigits(person.phone) : "-"}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                ) : (
                  <div className="py-8 text-center text-slate-400 font-bold border border-slate-150 rounded-2xl bg-slate-50/50 border-dashed">
                    هیچ فرد مرتبطی برای این پرونده ثبت نشده است.
                  </div>
                )}
              </div>
            ) : (
              /* Sub-page 5: Case Description */
              <div className="space-y-4 animate-fadeIn">
                <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                  <h3 className="text-xs font-extrabold text-slate-800 flex items-center gap-2">
                    <span className="w-6 h-6 rounded-full bg-teal-50 text-teal-600 flex items-center justify-center text-[10px] font-black">۵</span>
                    شرح خلاصه و مبانی وضعیت پرونده
                  </h3>
                  <button 
                    onClick={() => setPreviewSubPage(null)} 
                    className="px-3 py-1 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg text-[10px] font-bold transition flex items-center gap-1 cursor-pointer"
                  >
                    <ArrowLeft className="w-3.5 h-3.5" />
                    بازگشت به منو
                  </button>
                </div>

                <div className="border border-slate-200 p-6 rounded-2xl text-xs bg-slate-50/30 text-blue-600 font-semibold whitespace-pre-line leading-relaxed">
                  {toPersianDigits(printableCase.description)}
                </div>
              </div>
            )}

            {/* Bottom Global Actions row */}
            <div className="mt-8 pt-6 border-t border-slate-100 flex flex-col sm:flex-row items-center justify-between gap-4 no-print" dir="rtl">
              <span className="text-xs text-slate-500 font-bold">
                {previewSubPage !== null ? `بخش مشاهده جزئیات پرونده فعال است` : `پیش‌نمایش جزئیات پرونده`}
              </span>
              <div className="flex gap-3 w-full sm:w-auto">
                <button
                  type="button"
                  onClick={() => handlePrint(printableCase, includeFinancialInPrint)}
                  className="flex-1 sm:flex-initial px-6 py-3 bg-amber-500 hover:bg-amber-600 active:scale-95 text-white rounded-xl text-xs font-extrabold transition-all duration-150 cursor-pointer select-none touch-manipulation flex items-center justify-center gap-2 shadow-md active:shadow-inner"
                >
                  <Printer className="w-4 h-4 shrink-0" />
                  چاپ و ذخیره سنَد پرونده
                </button>
                {previewSubPage !== null ? (
                  <button
                    type="button"
                    onClick={() => setPreviewSubPage(null)}
                    className="flex-1 sm:flex-initial px-6 py-3 bg-slate-200 hover:bg-slate-300 active:scale-95 text-slate-700 rounded-xl text-xs font-bold transition-all duration-150 cursor-pointer select-none touch-manipulation text-center"
                  >
                    بازگشت به منو
                  </button>
                ) : (
                  <button
                    type="button"
                    onClick={() => setPrintableCase(null)}
                    className="flex-1 sm:flex-initial px-6 py-3 bg-slate-100 hover:bg-slate-200 active:scale-95 text-slate-700 rounded-xl text-xs font-bold transition-all duration-150 cursor-pointer select-none touch-manipulation text-center"
                  >
                    بستن پنجره
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Modal 3-C: Specialized Horizontal Case Finance Viewer */}
      {caseFinanceViewCase && (
        <div className="fixed inset-0 bg-slate-900/80 flex items-center justify-center p-4 z-50 animate-fadeIn backdrop-blur-sm overflow-y-auto">
          <div className="bg-white rounded-3xl shadow-2xl max-w-5xl w-full p-8 font-sans text-right" dir="rtl">
            
            {/* Header */}
            <div className="flex items-center justify-between border-b border-slate-100 pb-4 mb-6">
              <div className="flex items-center gap-3">
                <div className="p-2.5 bg-emerald-50 text-emerald-600 rounded-2xl border border-emerald-100">
                  <Coins className="w-5 h-5" />
                </div>
                <div>
                  <h2 className="text-sm font-extrabold text-slate-800">
                    تراز و جزئیات مالی پرونده: <span className="text-blue-600">{toPersianDigits(caseFinanceViewCase.title)}</span>
                  </h2>
                  <p className="text-[10px] text-slate-400 mt-1">مشاهده جریان و تراکنش‌های مالی به صورت کادرهای افقی مجزا</p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setCaseFinanceViewCase(null)}
                  className="w-8 h-8 rounded-full border border-slate-200 text-slate-400 hover:text-slate-600 flex items-center justify-center hover:bg-slate-50 cursor-pointer text-xs font-black shrink-0 active:scale-90 transition-transform duration-100"
                >
                  ✕
                </button>
              </div>
            </div>

            {/* Content Area */}
            <div className="space-y-8 text-right" dir="rtl">
              
              {/* کادر تنظیمات چاپ بخش مالی */}
              <div className="bg-slate-50 border border-slate-200 px-4 py-3 rounded-2xl flex items-center justify-between gap-4 animate-fadeIn max-w-md" dir="rtl">
                <span className="text-xs font-bold text-slate-700">آیا این موارد چاپ شود؟</span>
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => setIncludeFinancialInPrint(true)}
                    className={`px-4 py-1.5 rounded-xl text-xs font-extrabold transition-all cursor-pointer ${
                      includeFinancialInPrint
                        ? "bg-amber-500 text-white shadow-sm"
                        : "bg-white border border-slate-200 text-slate-600 hover:bg-slate-100"
                    }`}
                  >
                    بله
                  </button>
                  <button
                    type="button"
                    onClick={() => setIncludeFinancialInPrint(false)}
                    className={`px-4 py-1.5 rounded-xl text-xs font-extrabold transition-all cursor-pointer ${
                      !includeFinancialInPrint
                        ? "bg-slate-300 text-slate-800 shadow-sm"
                        : "bg-white border border-slate-200 text-slate-600 hover:bg-slate-100"
                    }`}
                  >
                    خیر
                  </button>
                </div>
              </div>

              {/* بخش اول: اقساط حق‌الوکاله */}
              <div className="space-y-3" dir="rtl">
                <h3 className="text-xs font-bold text-slate-700 border-r-4 border-amber-500 pr-2">الف) اقساط تعیین‌شده حق‌الوکاله</h3>
                
                {caseFinanceViewCase.installments && caseFinanceViewCase.installments.length > 0 ? (
                  <div className="flex flex-row gap-4 overflow-x-auto pb-4 pt-1 snap-x scrollbar-thin scrollbar-thumb-slate-200 w-full justify-start items-stretch text-right" dir="rtl">
                    {caseFinanceViewCase.installments.map((ins, idx) => (
                      <div 
                        key={idx} 
                        className={`min-w-[240px] max-w-[280px] p-4 rounded-2xl border snap-start flex-shrink-0 flex flex-col justify-between shadow-sm transition-all hover:-translate-y-0.5 duration-150 text-right ${
                          ins.isPaid 
                            ? 'bg-emerald-50/20 border-emerald-200' 
                            : 'bg-amber-50/15 border-amber-100'
                        }`}
                        dir="rtl"
                      >
                        <div className="flex justify-between items-center mb-2" dir="rtl">
                          <span className={`text-[10px] font-black px-2 py-0.5 rounded-full ${
                            ins.isPaid ? 'bg-emerald-100 text-emerald-800' : 'bg-amber-100 text-amber-800'
                          }`}>
                            قسط {toPersianDigits(idx + 1)}
                          </span>
                          <span className="text-[9px] font-mono font-bold text-slate-400">
                            {ins.isPaid ? "🟢 پرداخت‌شده" : "🔴 معوق / جاری"}
                          </span>
                        </div>
                        
                        <div className="space-y-1.5 mt-2 text-right" dir="rtl">
                          <p className="text-xs text-slate-800 text-right">
                            <span className="font-bold text-slate-500 text-[10px]">مبلغ:</span>{" "}
                            <span className="text-blue-600 font-black font-mono">{toPersianDigits((ins.amount ?? 0).toLocaleString())}</span>{" "}
                            <span className="text-[10px] text-slate-500">تومان</span>
                          </p>
                          <p className="text-[10px] text-slate-500 text-right">
                            <span className="font-bold text-slate-500 text-[10px]">تاریخ سررسید:</span>{" "}
                            <span className="font-mono text-slate-700 font-bold">{toPersianDigits(ins.dueDate || "-")}</span>
                          </p>
                          {ins.paidDate && (
                            <p className="text-[10px] text-emerald-600 text-right">
                              <span className="font-bold text-emerald-600 text-[10px]">واریز در:</span>{" "}
                              <span className="font-mono font-bold">{toPersianDigits(ins.paidDate)}</span>
                            </p>
                          )}
                          {ins.note && (
                            <p className="text-[10px] text-slate-400 italic truncate text-right" title={ins.note}>
                              <span className="font-bold text-slate-400 text-[10px]">بابت:</span> {ins.note}
                            </p>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="py-6 text-center text-slate-400 text-xs font-bold bg-slate-50/50 rounded-2xl border border-slate-100 border-dashed" dir="rtl">
                    هیچ قسط‌بندی برای این پرونده تعریف نشده است.
                  </div>
                )}
              </div>

              {/* ریز دریافت‌ها و واریزها */}
              <div className="space-y-3" dir="rtl">
                <h3 className="text-xs font-bold text-slate-700 border-r-4 border-amber-500 pr-2">ب) تاریخچه تراکنش‌ها و دریافتی‌ها</h3>
                
                {(() => {
                  const combinedTransactions = [
                    ...(caseFinanceViewCase.payments || []).map((p, pIdx) => ({
                      key: `pay-${pIdx}-${p.id || pIdx}`,
                      title: p.title || "تراکنش مالی",
                      amount: p.amount ?? 0,
                      date: p.date,
                      type: p.type || "کارت به کارت",
                      cardNumber: p.cardNumber,
                      isPaidInstallment: false,
                      receiptImage: p.receiptImage
                    })),
                    ...(caseFinanceViewCase.installments || [])
                      .filter(ins => ins.isPaid)
                      .map((ins, insIdx) => {
                        let parsedAmount = 0;
                        if (ins.amount) {
                          if (typeof ins.amount === "number") {
                            parsedAmount = ins.amount;
                          } else {
                            parsedAmount = parseFloat(ins.amount) || 0;
                          }
                        }
                        return {
                          key: `ins-${insIdx}-${ins.id || insIdx}`,
                          title: ins.note ? `قسط: ${ins.note}` : `قسط شماره ${toPersianDigits(insIdx + 1)}`,
                          amount: parsedAmount,
                          date: ins.paidDate || ins.dueDate,
                          type: "وصول اقساط",
                          cardNumber: "",
                          isPaidInstallment: true,
                          receiptImage: undefined
                        };
                      })
                  ];

                  return combinedTransactions.length > 0 ? (
                    <div className="flex flex-row gap-4 overflow-x-auto pb-4 pt-1 snap-x scrollbar-thin scrollbar-thumb-slate-200 w-full justify-start items-stretch text-right" dir="rtl">
                      {combinedTransactions.map((p) => (
                        <div 
                          key={p.key} 
                          className="min-w-[240px] max-w-[280px] p-4 rounded-2xl border border-slate-200 bg-slate-50/30 snap-start flex-shrink-0 flex flex-col justify-between shadow-sm transition-all hover:-translate-y-0.5 duration-150 hover:border-slate-300 text-right"
                          dir="rtl"
                        >
                          <div className="flex justify-between items-center mb-2" dir="rtl">
                            <span className={`text-[10px] font-black px-2.5 py-0.5 rounded-full ${p.isPaidInstallment ? 'bg-amber-100 text-amber-800' : 'bg-slate-100 text-slate-700'}`}>
                              {p.title}
                            </span>
                            <span className="text-[9px] font-black text-emerald-600">
                              {p.isPaidInstallment ? "وصول اقساطی" : "واریز موفق"}
                            </span>
                          </div>
                          
                          <div className="space-y-1.5 mt-2 text-right" dir="rtl">
                            <p className="text-xs text-emerald-700 text-right">
                              <span className="font-bold text-emerald-600 text-[10px]">مبلغ:</span>{" "}
                              <span className="font-mono font-black">{toPersianDigits((p.amount ?? 0).toLocaleString())}</span>{" "}
                              <span className="text-[10px] text-emerald-600">تومان</span>
                            </p>
                            <p className="text-[10px] text-slate-500 text-right">
                              <span className="font-bold text-slate-500 text-[10px]">تاریخ تراکنش:</span>{" "}
                              <span className="font-mono text-slate-700 font-bold">{toPersianDigits(p.date || "-")}</span>
                            </p>
                            <p className="text-[10px] text-slate-500 text-right">
                              <span className="font-bold text-slate-500 text-[10px]">روش پرداخت:</span>{" "}
                              <span className="text-slate-700 font-bold">{p.type}</span>
                            </p>
                            {p.cardNumber && (
                              <p className="text-[10px] text-slate-400 text-right">
                                <span className="font-bold text-slate-400 text-[10px]">کارت:</span>{" "}
                                <span className="font-mono font-bold text-slate-600">{toPersianDigits(p.cardNumber)}</span>
                              </p>
                            )}
                            {p.receiptImage && (
                              <div className="mt-2.5 pt-2 border-t border-slate-200/50 flex flex-col items-start gap-1">
                                <span className="text-[9px] text-slate-400 font-bold">رسید پرداخت:</span>
                                <img 
                                  src={p.receiptImage} 
                                  alt="رسید" 
                                  onClick={() => setSelectedReceiptImage(p.receiptImage || null)}
                                  className="w-12 h-12 object-cover rounded-lg border border-slate-200 cursor-zoom-in hover:opacity-85 transition-all duration-150"
                                  referrerPolicy="no-referrer"
                                />
                              </div>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="py-6 text-center text-slate-400 text-xs font-bold bg-slate-50/50 rounded-2xl border border-slate-100 border-dashed" dir="rtl">
                      تاکنون هیچ سند واریزی یا قسط پرداخت‌شده‌ای برای این پرونده ثبت نشده است.
                    </div>
                  );
                })()}
              </div>

            </div>

            {/* Footer buttons */}
            <div className="mt-8 pt-4 border-t border-slate-100 flex justify-between items-center">
              <span className="text-xs text-slate-400 font-bold">پایان ترازنامه مالی تخصصی پرونده</span>
              <div className="flex gap-2.5">
                {includeFinancialInPrint && (
                  <button
                    onClick={() => handlePrint(caseFinanceViewCase, true)}
                    className="px-5 py-2 bg-amber-500 hover:bg-amber-600 active:scale-95 text-white text-xs font-black rounded-xl transition cursor-pointer select-none flex items-center gap-1.5 shadow-md active:shadow-inner"
                  >
                    <Printer className="w-3.5 h-3.5" />
                    چاپ کامل سند پرونده (با بخش مالی)
                  </button>
                )}
                <button
                  onClick={() => setCaseFinanceViewCase(null)}
                  className="px-6 py-2 bg-slate-900 hover:bg-slate-800 active:scale-95 text-white text-xs font-bold rounded-xl transition cursor-pointer select-none"
                >
                  بستن ترازنامه مالی
                </button>
              </div>
            </div>

          </div>
        </div>
      )}

      {/* Modal 3-D: Printable Client View */}
      {printableClient && (
        <div className="fixed inset-0 bg-slate-900/80 flex items-center justify-center p-4 z-50 animate-fadeIn backdrop-blur-sm overflow-y-auto">
          <div className="bg-white rounded-3xl shadow-2xl max-w-2xl w-full p-6 font-sans text-right" dir="rtl">
            <div className="flex justify-between items-center mb-4 no-print border-b border-slate-100 pb-3">
              <h2 className="text-xs font-black text-slate-800">پیش نمایش اطلاعات هویتی موکل</h2>
              <div className="flex gap-2">
                <button
                  onClick={() => handlePrintClient(printableClient)}
                  className="px-4 py-2 bg-amber-500 hover:bg-amber-600 active:scale-95 text-white rounded-xl text-[11px] font-bold transition-all duration-150 cursor-pointer select-none touch-manipulation flex items-center gap-1.5 shadow-md active:shadow-inner"
                >
                  <Printer className="w-3.5 h-3.5 shrink-0" />
                  چاپ و ذخیره PDF
                </button>
                <button
                  onClick={() => setPrintableClient(null)}
                  className="px-4 py-2 bg-slate-200 hover:bg-slate-300 active:scale-95 text-slate-800 rounded-xl text-[11px] font-bold transition-all duration-150 cursor-pointer select-none touch-manipulation"
                >
                  بستن
                </button>
              </div>
            </div>
            {/* Printable Content - Detailed View */}
            <div className="text-[11px] text-slate-800 space-y-4">
                <div className="grid grid-cols-2 gap-x-4 gap-y-2 border-b border-slate-100 pb-3 text-xs">
                    <p><strong>نام موکل:</strong> {printableClient.name}</p>
                    <p><strong>کد ملی / شناسه ملی:</strong> <span className="font-mono">{toPersianDigits(printableClient.nationalId)}</span></p>
                    <p><strong>نام پدر:</strong> {printableClient.fatherName || "-"}</p>
                    <p><strong>تاریخ تولد:</strong> <span className="font-mono">{printableClient.birthDate ? toPersianDigits(printableClient.birthDate) : "-"}</span></p>
                </div>

                <div className="bg-amber-50/20 p-4 rounded-xl border border-amber-100/60 space-y-2.5">
                    <h3 className="font-black text-slate-800 text-xs border-r-2 border-amber-500 pr-2">اطلاعات تماس و نشانی قانونی موکل</h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-2 text-xs pt-1">
                        <div className="bg-white p-2 rounded-lg border border-slate-100">
                            <span className="text-[10px] text-slate-500 block font-bold mb-0.5">تلفن همراه ثنا:</span>
                            <span className="font-mono text-amber-700 font-extrabold text-xs">{toPersianDigits(printableClient.phoneNumber)}</span>
                        </div>
                        <div className="bg-white p-2 rounded-lg border border-slate-100">
                            <span className="text-[10px] text-slate-500 block font-bold mb-0.5">یادداشت اداری / صنف:</span>
                            <span className="text-slate-800 font-bold">{printableClient.description || "توضیحی ثبت نشده است."}</span>
                        </div>
                        <div className="bg-white p-2 rounded-lg border border-slate-100 md:col-span-2">
                            <span className="text-[10px] text-slate-500 block font-bold mb-0.5">نشانی قانونی پستی اقامتگاه:</span>
                            <span className="text-slate-800 font-semibold">{toPersianDigits(printableClient.address || "آدرسی ثبت نشده است.")}</span>
                        </div>
                    </div>
                </div>
            </div>
          </div>
        </div>
      )}

      {/* Modal 3: MASTER CASE VISUAL EXPLORER FILE (Notes & documents & uploads) */}
      {selectedCase && (
        <div className="fixed inset-0 bg-slate-900/60 flex items-center justify-center p-4 z-40 animate-fadeIn backdrop-blur-sm overflow-y-auto">
          <div className="bg-white rounded-3xl border border-slate-100 shadow-2xl max-w-4xl w-full p-6 text-xs text-slate-700 font-semibold space-y-6 my-8">
            {/* Header */}
            <div className="flex items-center justify-between border-b border-slate-100 pb-4">
              <div className="flex items-center gap-3">
                <div className="p-2.5 bg-amber-50 text-amber-600 rounded-2xl border border-amber-100">
                  <Briefcase className="w-5 h-5" />
                </div>
                <div>
                  <h2 className="text-sm font-extrabold text-slate-800">
                    پرونده
                  </h2>

                </div>
              </div>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => handlePrint(selectedCase || undefined)}
                  className="px-4 py-2 bg-amber-50 hover:bg-slate-900 active:scale-95 border border-amber-200 hover:border-slate-800 text-amber-900 hover:text-white font-bold rounded-xl flex items-center gap-2 transition-all duration-150 select-none cursor-pointer touch-manipulation text-[11px] shadow-sm active:shadow-inner"
                  title="چاپ یا ذخیره نسخه PDF پرونده"
                >
                  <Printer className="w-4 h-4 text-amber-600 shrink-0" />
                  چاپ و PDF
                </button>
                <button
                  type="button"
                  onClick={() => handlePrint(selectedCase || undefined, true, true)}
                  className="px-4 py-2 bg-blue-50 hover:bg-blue-600 active:scale-95 border border-blue-200 hover:border-blue-700 text-blue-900 hover:text-white font-bold rounded-xl flex items-center gap-2 transition-all duration-150 select-none cursor-pointer touch-manipulation text-[11px] shadow-sm active:shadow-inner"
                  title="تولید گزارش جامع شامل یادداشت‌ها و اسناد"
                >
                  <FileText className="w-4 h-4 text-blue-600 shrink-0 group-hover:text-white" />
                  گزارش جامع (PDF)
                </button>
                <button
                  onClick={() => setSelectedCase(null)}
                  className="w-8 h-8 rounded-full border border-slate-200 text-slate-400 hover:text-slate-600 flex items-center justify-center hover:bg-slate-50 cursor-pointer text-xs font-black shrink-0 active:scale-90 transition-transform duration-100"
                >
                  ✕
                </button>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-12 gap-6 items-start">
              {/* Files & Attachments explorer (12 cols) */}
              <div className="md:col-span-12 space-y-6">
                <div className="space-y-4">

                  {/* Drag drop zone container */}
                  <div
                    onDragEnter={handleDrag}
                    onDragOver={handleDrag}
                    onDragLeave={handleDrag}
                    onDrop={handleDrop}
                    className={`border-2 border-dashed rounded-2xl p-6 text-center cursor-pointer transition relative ${
                      dragActive
                        ? "border-amber-500 bg-amber-50/50"
                        : "border-slate-200 hover:border-amber-400 bg-slate-50/50"
                    }`}
                  >
                    <input
                      type="file"
                      id="case_file_upload"
                      multiple={false}
                      onChange={handleFileUpload}
                      className="hidden"
                      accept=".pdf, image/*, audio/*"
                    />
                    <label htmlFor="case_file_upload" className="cursor-pointer block space-y-2">
                      <FileUp className="w-8 h-8 text-slate-400 mx-auto" />
                      <div className="text-[11px] font-bold text-slate-700">رها کردن فایل در این ناحیه یا کلیک جهت بارگذاری</div>
                      <p className="text-[9px] text-slate-400">اسناد مربوطه، تصاویر عوارض، فرمت‌های تصویر، صدا و PDF (حداکثر ۲۰ مگابایت)</p>
                    </label>
                  </div>
                </div>

                  <div className="space-y-4">
                    <div className="flex flex-col gap-3 bg-slate-50 p-4 rounded-2xl border border-slate-100">
                      <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
                        <span className="text-[10px] text-slate-400 font-bold block">مجموع پرونده‌های پیوست ({toPersianDigits(activeCaseDocs.length)}):</span>
                        
                        {activeCaseDocs.length > 0 && (
                          <div className="flex items-center gap-2 flex-1 md:justify-end">
                            <div className="relative w-full max-w-xs">
                              <input 
                                type="text" 
                                placeholder="جستجو در نام، محتوا و مواد قانونی..." 
                                value={docSearchQuery}
                                onChange={(e) => setDocSearchQuery(e.target.value)}
                                className="w-full bg-white border border-slate-200 rounded-xl px-3 py-1.5 pr-8 text-xs font-bold text-slate-700 outline-none focus:border-amber-500"
                              />
                              <Search className="w-3.5 h-3.5 text-slate-400 absolute right-2.5 top-1/2 -translate-y-1/2" />
                            </div>
                            <select
                              value={docTagFilter}
                              onChange={(e) => setDocTagFilter(e.target.value as any)}
                              className="bg-white border border-slate-200 rounded-xl px-3 py-1.5 text-xs font-bold text-slate-700 outline-none w-28 shrink-0"
                            >
                              <option value="all">همه برچسب‌ها</option>
                              <option value="عادی">عادی</option>
                              <option value="محرمانه">محرمانه</option>
                              <option value="فوری">فوری</option>
                              <option value="آرشیو">آرشیو</option>
                            </select>
                          </div>
                        )}
                      </div>

                      {activeCaseDocs.length > 0 && (
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-3 pt-2 border-t border-slate-200/50">
                          <div className="space-y-1">
                            <label className="text-[9px] text-slate-500 pr-1">نوع سند</label>
                            <select
                              value={docTypeFilter}
                              onChange={(e) => setDocTypeFilter(e.target.value as any)}
                              className="w-full bg-white border border-slate-200 rounded-xl px-3 py-1.5 text-xs font-bold text-slate-700 outline-none"
                            >
                              <option value="all">همه انواع</option>
                              <option value="pdf">فایل PDF</option>
                              <option value="image">تصاویر</option>
                              <option value="doc">اسناد متنی</option>
                              <option value="audio">فایل صوتی</option>
                              <option value="other">سایر موارد</option>
                            </select>
                          </div>
                          <div className="space-y-1">
                            <label className="text-[9px] text-slate-500 pr-1">از تاریخ</label>
                            <input 
                              type="text" 
                              placeholder="۱۴۰۳/۰۱/۰۱" 
                              value={docDateFrom}
                              onChange={(e) => setDocDateFrom(e.target.value)}
                              className="w-full bg-white border border-slate-200 rounded-xl px-3 py-1.5 text-xs font-bold text-slate-700 outline-none ltr text-right"
                            />
                          </div>
                          <div className="space-y-1">
                            <label className="text-[9px] text-slate-500 pr-1">تا تاریخ</label>
                            <input 
                              type="text" 
                              placeholder="۱۴۰۳/۱۲/۲۹" 
                              value={docDateTo}
                              onChange={(e) => setDocDateTo(e.target.value)}
                              className="w-full bg-white border border-slate-200 rounded-xl px-3 py-1.5 text-xs font-bold text-slate-700 outline-none ltr text-right"
                            />
                          </div>
                        </div>
                      )}
                    </div>

                  <div className="space-y-2 max-h-[220px] overflow-y-auto">
                    {activeCaseDocs.length === 0 ? (
                      <p className="text-[10px] text-slate-400 text-center py-6 bg-slate-50/10 border border-dotted border-slate-100 rounded-xl">سندی الصاق نشده است.</p>
                    ) : filteredCaseDocs.length === 0 ? (
                      <p className="text-[10px] text-slate-400 text-center py-6 bg-slate-50/10 border border-dotted border-slate-100 rounded-xl">سندی با این مشخصات یافت نشد.</p>
                    ) : (
                      filteredCaseDocs.map(doc => (
                        <div key={doc.id} className="p-2 bg-slate-50 border border-slate-100 rounded-xl flex items-center justify-between group hover:border-amber-200">
                          <div className="flex items-center gap-2 min-w-0">
                            {doc.type === "image" && doc.dataUrl ? (
                              <img src={doc.dataUrl} alt={doc.name} className="w-8 h-8 rounded object-cover border border-slate-200 shrink-0" />
                            ) : doc.type === "image" ? (
                              <div className="w-8 h-8 rounded bg-amber-50 border border-amber-100 text-amber-500 flex items-center justify-center shrink-0">
                                <ImageIcon className="w-4 h-4" />
                              </div>
                            ) : (
                              <div className="w-8 h-8 rounded bg-blue-50 border border-blue-100 text-blue-500 flex items-center justify-center shrink-0">
                                <FileText className="w-4 h-4" />
                              </div>
                            )}
                            <div className="min-w-0 text-[10px] flex-1">
                              {editingDocId === doc.id ? (
                                <div className="space-y-2 bg-white p-2 rounded-lg border border-slate-200 shadow-sm">
                                  <div className="space-y-1">
                                    <label className="text-[8px] font-black text-slate-400">نام سند:</label>
                                    <input
                                      type="text"
                                      value={editDocName}
                                      onChange={(e) => setEditDocName(e.target.value)}
                                      className="w-full px-2 py-1 bg-slate-50 border border-slate-100 rounded text-[10px] font-bold outline-none focus:ring-1 focus:ring-amber-500"
                                      autoFocus
                                    />
                                  </div>
                                  <div className="grid grid-cols-2 gap-2">
                                    <div className="space-y-1">
                                      <label className="text-[8px] font-black text-slate-400">برچسب:</label>
                                      <select
                                        value={editDocTag}
                                        onChange={(e) => setEditDocTag(e.target.value as any)}
                                        className="w-full px-2 py-1 bg-slate-50 border border-slate-100 rounded text-[10px] font-bold outline-none"
                                      >
                                        <option value="عادی">عادی</option>
                                        <option value="محرمانه">محرمانه</option>
                                        <option value="فوری">فوری</option>
                                        <option value="آرشیو">آرشیو</option>
                                      </select>
                                    </div>
                                    <div className="space-y-1">
                                      <label className="text-[8px] font-black text-slate-400">ماده استنادی:</label>
                                      <input
                                        type="text"
                                        value={editDocLawArticle}
                                        onChange={(e) => setEditDocLawArticle(e.target.value)}
                                        className="w-full px-2 py-1 bg-slate-50 border border-slate-100 rounded text-[10px] font-bold outline-none focus:ring-1 focus:ring-amber-500"
                                      />
                                    </div>
                                  </div>
                                  <div className="space-y-1">
                                    <label className="text-[8px] font-black text-slate-400">متن ماده قانونی:</label>
                                    <textarea
                                      value={editDocLawText}
                                      onChange={(e) => setEditDocLawText(e.target.value)}
                                      rows={1}
                                      className="w-full px-2 py-1 bg-slate-50 border border-slate-100 rounded text-[9px] font-medium outline-none focus:ring-1 focus:ring-amber-500 resize-none"
                                    />
                                  </div>
                                  <div className="flex justify-end gap-1.5 pt-1">
                                    <button
                                      onClick={() => handleSaveEditedDoc(doc.id)}
                                      className="px-3 py-1 bg-green-600 text-white text-[9px] font-black rounded-lg hover:bg-green-700 shadow-sm"
                                    >
                                      ذخیره تغییرات
                                    </button>
                                    <button
                                      onClick={() => setEditingDocId(null)}
                                      className="px-3 py-1 bg-slate-100 text-slate-600 text-[9px] font-black rounded-lg hover:bg-slate-200"
                                    >
                                      انصراف
                                    </button>
                                  </div>
                                </div>
                              ) : (
                                <>
                                  <div className="flex items-center gap-2 mb-0.5">
                                    <p className="font-bold text-slate-800 truncate" title={doc.name}>{doc.name}</p>
                                    {doc.tag && doc.tag !== "عادی" && (
                                      <span className={`px-1.5 py-0.5 rounded text-[8px] font-black shrink-0 ${
                                        doc.tag === "محرمانه" ? "bg-red-50 text-red-600 border border-red-100" :
                                        doc.tag === "فوری" ? "bg-orange-50 text-orange-600 border border-orange-100" :
                                        doc.tag === "آرشیو" ? "bg-slate-100 text-slate-500 border border-slate-200" :
                                        "bg-blue-50 text-blue-600 border border-blue-100"
                                      }`}>
                                        {doc.tag}
                                      </span>
                                    )}
                                  </div>
                                  {doc.lawArticle && (
                                    <div className="text-[9px] text-amber-700 font-black mb-0.5 bg-amber-50 px-1.5 py-0.5 rounded border border-amber-100 inline-block">
                                      استناد: {doc.lawArticle}
                                    </div>
                                  )}
                                  {doc.lawText && (
                                    <p className="text-[8px] text-slate-500 line-clamp-1 italic mb-0.5" title={doc.lawText}>
                                      {doc.lawText}
                                    </p>
                                  )}
                                  <p className="text-[8px] text-slate-400">{doc.size} | {toPersianDigits(doc.uploadedAt)}</p>
                                </>
                              )}
                            </div>
                          </div>
                          <div className="flex items-center gap-1.5">
                            <button
                              onClick={() => moveDocument(doc.id, "up")}
                              disabled={activeCaseDocs.indexOf(doc) === 0}
                              className={`p-1 text-slate-500 hover:text-slate-800 hover:bg-slate-100 rounded cursor-pointer disabled:opacity-20 ${activeCaseDocs.indexOf(doc) === 0 ? "cursor-not-allowed" : ""}`}
                              title="انتقال به بالا"
                            >
                              <ChevronUp className="w-3.5 h-3.5" />
                            </button>
                            <button
                              onClick={() => moveDocument(doc.id, "down")}
                              disabled={activeCaseDocs.indexOf(doc) === activeCaseDocs.length - 1}
                              className={`p-1 text-slate-500 hover:text-slate-800 hover:bg-slate-100 rounded cursor-pointer disabled:opacity-20 ${activeCaseDocs.indexOf(doc) === activeCaseDocs.length - 1 ? "cursor-not-allowed" : ""}`}
                              title="انتقال به پایین"
                            >
                              <ChevronDown className="w-3.5 h-3.5" />
                            </button>
                            <button
                              onClick={() => handleViewDocument(doc)}
                              className="text-slate-600 hover:text-slate-800 p-1.5 rounded-lg hover:bg-slate-100 cursor-pointer"
                              title="مشاهده"
                            >
                              <Eye className="w-3.5 h-3.5" />
                            </button>
                            {editingDocId !== doc.id && (
                              <button
                                onClick={() => {
                                  setEditingDocId(doc.id);
                                  setEditDocName(doc.name);
                                  setEditDocTag(doc.tag || "عادی");
                                  setEditDocLawArticle(doc.lawArticle || "");
                                  setEditDocLawText(doc.lawText || "");
                                }}
                                className="text-blue-600 hover:text-blue-800 p-1.5 rounded-lg hover:bg-blue-50 cursor-pointer"
                                title="ویرایش مشخصات سند"
                              >
                                <Edit2 className="w-3.5 h-3.5" />
                              </button>
                            )}
                            <button
                              onClick={() => onDeleteDocument(doc.id)}
                              className="text-red-500 hover:text-red-700 p-1.5 rounded-lg hover:bg-red-50 cursor-pointer"
                              title="امحا و حذف سند"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                            {onNavigateToAlarms && (
                              <button
                                onClick={onNavigateToAlarms}
                                className="text-purple-600 hover:text-purple-800 p-1.5 rounded-lg hover:bg-purple-50 cursor-pointer border border-purple-100"
                                title="ثبت در آلارم‌های قضایی"
                              >
                                <Bell className="w-3.5 h-3.5" />
                              </button>
                            )}
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                </div>

                {/* Back button container */}
                <div className="mt-8 bg-slate-50 border border-slate-200 rounded-2xl p-4 flex flex-col sm:flex-row items-center justify-between gap-4">
                  <span className="text-xs font-bold text-slate-600">پایان مشاهده مدارک پرونده</span>
                  <button
                    onClick={() => setSelectedCase(null)}
                    className="px-6 py-2 bg-slate-900 hover:bg-amber-600 text-white font-bold rounded-xl flex items-center gap-2 transition select-none cursor-pointer text-xs"
                  >
                    بازگشت به فهرست پرونده‌ها
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Interactive Document View / Preview Overlay */}
      {previewDoc && (
        <div className="fixed inset-0 bg-slate-950/90 z-[60] flex flex-col items-center justify-center p-2 sm:p-4 backdrop-blur-md">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl sm:rounded-3xl w-full max-w-4xl h-full sm:h-auto sm:max-h-[90vh] overflow-hidden shadow-2xl flex flex-col">
            {/* Header */}
            <div className="p-4 bg-slate-950 border-b border-slate-850 flex items-center justify-between text-white">
              <div className="flex items-center gap-2">
                <FileText className="w-5 h-5 text-amber-400" />
                <div className="text-right">
                  <h3 className="text-xs font-bold text-slate-100 truncate max-w-md">{previewDoc.name}</h3>
                  <p className="text-[9px] text-slate-400 mt-0.5">{previewDoc.size} | بارگذاری شده در {toPersianDigits(previewDoc.uploadedAt)}</p>
                </div>
              </div>
              <button
                type="button"
                onClick={closePreview}
                className="w-8 h-8 rounded-full bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white flex items-center justify-center cursor-pointer text-xs font-black"
              >
                ✕
              </button>
            </div>

            {/* Document Body View Area */}
            <div className="p-4 sm:p-6 flex-grow flex items-center justify-center min-h-[300px] h-[calc(100vh-160px)] sm:h-[550px] md:h-[650px] overflow-auto bg-slate-950/20">
              {(previewDoc.type === "image" || previewDoc.dataUrl?.startsWith("data:image/")) && previewDoc.dataUrl ? (
                <img
                  src={previewDoc.dataUrl}
                  alt={previewDoc.name}
                  className="max-w-full max-h-[80vh] sm:max-h-[500px] md:max-h-[600px] rounded-xl border border-slate-800 object-contain shadow-lg"
                  referrerPolicy="no-referrer"
                />
              ) : ((previewDoc.type === "pdf" || previewDoc.dataUrl?.startsWith("data:application/pdf") || previewDoc.dataUrl?.startsWith("blob:") || previewDoc.name?.toLowerCase().endsWith(".pdf")) && previewDoc.dataUrl) ? (
                <object
                  data={previewDoc.dataUrl}
                  type="application/pdf"
                  className="w-full h-full min-h-[400px] rounded-xl border border-slate-800 shadow bg-white"
                >
                  <div className="flex flex-col items-center justify-center p-8 text-center space-y-4">
                    <div className="w-16 h-16 rounded-2xl bg-slate-800/50 flex items-center justify-center text-slate-300 mx-auto">
                      <FileText className="w-8 h-8" />
                    </div>
                    <div>
                      <p className="text-slate-200 font-bold mb-2">مرورگر شما قادر به نمایش مستقیم PDF نیست</p>
                      <p className="text-[11px] text-slate-400 mb-4">لطفاً فایل را از طریق دکمه‌های زیر بارگیری یا باز کنید.</p>
                      <div className="flex flex-col sm:flex-row gap-3 justify-center items-center">
                        <button 
                          type="button" 
                          onClick={() => triggerOpenInNewTab(previewDoc)} 
                          className="px-5 py-2.5 bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold rounded-xl transition inline-block cursor-pointer shadow-lg shadow-blue-500/20 active:scale-95 text-center w-full sm:w-auto"
                        >
                          باز کردن در صفحه جدید
                        </button>
                        <button 
                          type="button" 
                          onClick={() => triggerDirectDownload(previewDoc.dataUrl!, previewDoc.name)} 
                          className="px-5 py-2.5 bg-amber-500 hover:bg-amber-600 text-slate-950 text-xs font-black rounded-xl transition inline-block cursor-pointer shadow-lg shadow-amber-500/20 active:scale-95 text-center w-full sm:w-auto"
                        >
                          دانلود مستقیم سند
                        </button>
                      </div>
                    </div>
                  </div>
                </object>
              ) : (previewDoc.type as string) === "audio" || previewDoc.dataUrl?.startsWith("data:audio/") || previewDoc.dataUrl?.startsWith("blob:") && (previewDoc.type as string) === "audio" ? (
                <div className="flex flex-col items-center justify-center w-full max-w-md p-8 bg-slate-900 rounded-3xl border border-slate-800 shadow-2xl space-y-6">
                  <div className="w-20 h-20 rounded-full bg-indigo-500/10 border border-indigo-500/30 flex items-center justify-center shadow-[0_0_30px_rgba(99,102,241,0.15)] mx-auto relative overflow-hidden">
                    <div className="absolute inset-0 bg-indigo-500/20 blur-xl animate-pulse"></div>
                    <svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-indigo-400 relative z-10"><path d="M12 2a3 3 0 0 0-3 3v7a3 3 0 0 0 6 0V5a3 3 0 0 0-3-3Z"></path><path d="M19 10v2a7 7 0 0 1-14 0v-2"></path><line x1="12" x2="12" y1="19" y2="22"></line></svg>
                  </div>
                  <div className="w-full text-center space-y-1">
                    <p className="text-slate-200 font-bold text-sm truncate px-4" dir="ltr">{previewDoc.name}</p>
                    <p className="text-indigo-400 text-[10px] uppercase tracking-widest font-black">Audio File</p>
                  </div>
                  <audio 
                    controls 
                    src={previewDoc.dataUrl} 
                    className="w-full outline-none"
                    controlsList="nodownload"
                  />
                </div>
              ) : previewDoc.dataUrl ? (
                <div className="text-center space-y-4 py-12 text-slate-400">
                  <div className="w-16 h-16 rounded-2xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center text-amber-500 mx-auto">
                    <FileText className="w-8 h-8" />
                  </div>
                  <div className="space-y-1">
                    <p className="text-xs font-bold text-slate-200">این نوع فایل قابلیت پیش‌نمایش ندارد</p>
                    <p className="text-[10px] text-slate-500 max-w-sm mx-auto leading-relaxed">
                      لطفا فایل را با استفاده از دکمه تعبیه شده پایین دانلود کرده و باز کنید.
                    </p>
                  </div>
                </div>
              ) : (
                <div className="text-center space-y-4 py-12 text-slate-400">
                  <div className="w-16 h-16 rounded-2xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center text-amber-500 mx-auto">
                    <FileText className="w-8 h-8" />
                  </div>
                  <div className="space-y-1">
                    <p className="text-xs font-bold text-slate-200">فایل یافت نشد یا محتوایی ندارد</p>
                    <p className="text-[10px] text-red-400 max-w-sm mx-auto leading-relaxed">
                      به نظر می‌رسد این فایل فاقد محتوای نمایشی است (احتمالاً در حین بارگذاری به دلیل محدودیت حجم، ذخیره نشده است). لطفاً فایل را مجدداً با حجم کمتر بارگذاری کنید.
                    </p>
                  </div>
                </div>
              )}
            </div>

            {/* Action Footer */}
            <div className="p-4 bg-slate-950 border-t border-slate-850 flex items-center justify-between gap-4">
              <p className="text-[9px] text-slate-500">پورتال هوشمند وکالت - نمایش امن پیش‌نمایش اسناد</p>
              <div className="flex gap-2">
                {previewDoc.dataUrl && (
                  <button
                    type="button"
                    onClick={() => triggerDirectDownload(previewDoc.dataUrl!, previewDoc.name)}
                    className="px-4 py-2 bg-amber-500 hover:bg-amber-600 text-slate-950 text-xs font-black rounded-xl transition flex items-center gap-1.5 cursor-pointer"
                  >
                    بارگیری و دانلود
                  </button>
                )}
                <button
                  type="button"
                  onClick={closePreview}
                  className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-white text-xs font-bold rounded-xl transition cursor-pointer"
                >
                  بستن پیش‌نمایش
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
      {/* Modal 3: Notes Manager */}
      {showNotesManager && (
        <div className="fixed inset-0 bg-slate-900/60 flex items-center justify-center p-2 sm:p-4 z-50 animate-fadeIn backdrop-blur-sm">
          <div className="bg-white rounded-3xl border border-slate-100 shadow-2xl max-w-5xl w-full h-[90vh] md:h-[85vh] flex flex-col overflow-hidden">
            {/* Header */}
            <div className="p-4 sm:p-5 border-b border-slate-100 flex items-center justify-between bg-slate-50/50 shrink-0">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-amber-100 text-amber-700 rounded-xl">
                  <FileText className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-xs sm:text-sm font-black text-slate-800">مدیریت یادداشت‌های تخصصی پرونده</h3>
                  <p className="text-[9px] sm:text-[10px] text-slate-500 font-bold mt-0.5">پرونده: {showNotesManager.title} ({showNotesManager.clientName})</p>
                </div>
              </div>
              <button 
                onClick={() => {
                  setShowNotesManager(null);
                  setNoteContent("");
                  setEditNoteTitle("");
                  setEditingNoteId(null);
                }} 
                className="w-8 h-8 flex items-center justify-center rounded-full bg-white border border-slate-200 text-slate-400 hover:text-slate-600 hover:border-slate-300 transition cursor-pointer"
              >
                ✕
              </button>
            </div>

            <div className="flex-1 flex flex-col md:flex-row overflow-hidden">
              {/* Sidebar: List of notes */}
              <div className="w-full md:w-64 border-b md:border-b-0 md:border-l border-slate-100 bg-slate-50/30 overflow-y-auto p-3 sm:p-4 space-y-2 sm:space-y-3 h-36 md:h-auto shrink-0 animate-fadeIn">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-[10px] font-black text-slate-400">تاریخچه یادداشت‌ها</span>
                  <button 
                    onClick={() => {
                      setEditingNoteId(null);
                      setEditNoteTitle("");
                      setNoteContent("");
                    }}
                    className="p-1 text-amber-600 hover:bg-amber-50 rounded-lg transition"
                    title="یادداشت جدید"
                  >
                    <Plus className="w-4 h-4" />
                  </button>
                </div>
                
                {notes.filter(n => n.caseId === showNotesManager.id).length === 0 ? (
                  <div className="text-center py-4 opacity-40">
                    <Edit2 className="w-6 h-6 mx-auto mb-1 stroke-1" />
                    <p className="text-[8px] font-bold">هنوز یادداشتی ثبت نشده است</p>
                  </div>
                ) : (
                  notes.filter(n => n.caseId === showNotesManager.id).map(note => (
                    <button
                      key={note.id}
                      onClick={() => {
                        setEditingNoteId(note.id);
                        setEditNoteTitle(note.title);
                        setNoteContent(note.content);
                      }}
                      className={`w-full text-right p-2 sm:p-2.5 rounded-xl border transition group block ${
                        editingNoteId === note.id 
                          ? "bg-amber-50 border-amber-200 shadow-sm" 
                          : "bg-white border-slate-100 hover:border-amber-100 hover:bg-slate-50"
                      }`}
                    >
                      <h4 className={`text-[9px] sm:text-[10px] font-black truncate ${editingNoteId === note.id ? "text-amber-900" : "text-slate-700"}`}>
                        {note.title}
                      </h4>
                      <p className="text-[8px] sm:text-[9px] text-slate-400 font-bold mt-1">
                        {(() => {
                           const parts = note.createdAt?.split('/');
                           if (parts && parts.length === 3) {
                             const lookup = ["فروردین","اردیبهشت","خرداد","تیر","مرداد","شهریور","مهر","آبان","آذر","دی","بهمن","اسفند"];
                             const eDigits = parts[1].replace(/[۰-۹]/g, c => '0123456789'['۰۱۲۳۴۵۶۷۸۹'.indexOf(c)]);
                             const mIdx = parseInt(eDigits, 10) - 1;
                             if (lookup[mIdx]) return `${parts[2]} ${lookup[mIdx]} ${parts[0]}`;
                           }
                           return note.createdAt;
                        })()}
                      </p>
                      <div className="flex justify-between items-center mt-2 group-hover:opacity-100 transition">
                         <Trash2 
                          onClick={(e) => {
                            e.stopPropagation();
                            onDeleteNote(note.id);
                            if (editingNoteId === note.id) {
                              setEditingNoteId(null);
                              setEditNoteTitle("");
                              setNoteContent("");
                            }
                          }}
                          className="w-4 h-4 text-slate-300 hover:text-red-600 transition" 
                         />
                      </div>
                    </button>
                  ))
                )}
              </div>

              {/* Main Content: Editor */}
              <div className="flex-1 p-4 sm:p-6 flex flex-col space-y-3 sm:space-y-4 bg-white overflow-hidden">
                <div className="space-y-1 shrink-0">
                  <label className="text-[9px] sm:text-[10px] font-black text-slate-400 mr-1">عنوان یادداشت (موضوعی)</label>
                  <input
                    type="text"
                    value={editNoteTitle}
                    onChange={(e) => setEditNoteTitle(e.target.value)}
                    placeholder="مثال: گزارش ابلاغیه، نکات لایحه تجدیدنظر..."
                    className="w-full px-3 py-2 sm:px-4 sm:py-3 bg-slate-50 border border-slate-200 rounded-xl sm:rounded-2xl font-bold text-xs outline-none focus:ring-2 focus:ring-amber-500/10 transition"
                  />
                </div>
                
                <div className="flex-1 flex flex-col space-y-1 overflow-hidden">
                  <label className="text-[9px] sm:text-[10px] font-black text-slate-400 mr-1 shrink-0">متن تفصیلی یادداشت</label>
                  <textarea
                    value={noteContent}
                    onChange={(e) => setNoteContent(e.target.value)}
                    placeholder="تمامی جزئیات، شماره کلاسه، مفاد رای یا اقدامات لازم را اینجا به صورت مفصل یادداشت نمایید..."
                    className="flex-1 w-full px-3 py-3 sm:px-4 sm:py-4 bg-slate-50 border border-slate-200 rounded-2xl sm:rounded-3xl font-bold text-xs outline-none focus:ring-2 focus:ring-amber-500/10 resize-none leading-relaxed overflow-y-auto"
                  />
                </div>

                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 pt-2 border-t border-slate-100 shrink-0">
                  <p className="text-[8px] sm:text-[9px] text-slate-400 font-bold bg-slate-50 px-2.5 py-1 sm:py-1.5 rounded-full border border-slate-100 self-start sm:self-auto">
                    <Clock className="w-3 h-3 inline-block ml-1" />
                    تاریخ سیستم: {toPersianDigits(new Date().toLocaleDateString("fa-IR"))}
                  </p>
                  
                  <div className="flex flex-wrap gap-2 justify-end">
                    {editingNoteId && (
                      <button
                        type="button"
                        onClick={() => {
                          onDeleteNote(editingNoteId);
                          setEditingNoteId(null);
                          setEditNoteTitle("");
                          setNoteContent("");
                        }}
                        className="px-3 py-1.5 bg-red-50 text-red-600 border border-red-100 rounded-lg sm:rounded-xl font-bold hover:bg-red-600 hover:text-white transition text-[10px] sm:text-[11px] flex justify-center items-center gap-1 cursor-pointer shrink-0"
                        title="حذف این یادداشت"
                      >
                         <Trash2 className="w-3.5 h-3.5" />
                         حذف
                      </button>
                    )}
                    <button 
                      type="button" 
                      onClick={() => {
                        setShowNotesManager(null);
                        setNoteContent("");
                        setEditNoteTitle("");
                        setEditingNoteId(null);
                      }} 
                      className="px-3 py-1.5 bg-slate-100 text-slate-600 rounded-lg sm:rounded-xl font-bold hover:bg-slate-200 transition text-[10px] sm:text-[11px] cursor-pointer shrink-0"
                    >
                      بستن پنجره
                    </button>
                    
                    <button 
                      type="button" 
                      onClick={() => {
                        if (noteContent.trim()) {
                          if (editingNoteId) {
                            onUpdateNote(editingNoteId, editNoteTitle.trim() || "یادداشت ویرایش شده", noteContent);
                          } else {
                            const newNote = {
                               id: "no_" + Date.now(),
                               caseId: showNotesManager.id,
                               title: editNoteTitle.trim() || "یادداشت جدید",
                               content: noteContent,
                               createdAt: new Date().toLocaleDateString("fa-IR", { year: "numeric", month: "long", day: "numeric" })
                            };
                            onAddNote(newNote);
                          }
                          // Keep the modal open but maybe clear or select the note
                          setNoteContent("");
                          setEditNoteTitle("");
                          setEditingNoteId(null);
                        }
                      }} 
                      className="px-4 py-1.5 bg-slate-900 text-white rounded-lg sm:rounded-xl font-black hover:bg-amber-600 shadow-md shadow-slate-250/20 transition text-[10px] sm:text-[11px] shrink-0"
                    >
                      ذخیره یادداشت
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Zoomed Receipt Image Modal */}
      {selectedReceiptImage && (
        <div className="fixed inset-0 bg-slate-950/80 flex items-center justify-center p-4 z-[9999] animate-fadeIn backdrop-blur-md">
          <div className="bg-slate-900 border border-slate-800 rounded-3xl max-w-lg w-full overflow-hidden shadow-2xl flex flex-col max-h-[90vh]">
            <div className="p-4 border-b border-slate-800 flex items-center justify-between text-white">
              <span className="text-xs font-black">تصویر فیش / رسید پرداخت</span>
              <button 
                onClick={() => setSelectedReceiptImage(null)} 
                className="text-slate-400 hover:text-white p-1 text-sm font-bold bg-slate-800 rounded-full w-6 h-6 flex items-center justify-center cursor-pointer transition-all"
              >
                ✕
              </button>
            </div>
            <div className="flex-1 overflow-y-auto p-4 flex items-center justify-center bg-slate-950">
              <img 
                src={selectedReceiptImage} 
                alt="رسید پرداخت" 
                className="max-w-full max-h-[65vh] object-contain rounded-2xl border border-slate-800 shadow-lg" 
                referrerPolicy="no-referrer"
              />
            </div>
            <div className="p-4 bg-slate-900 border-t border-slate-800 flex items-center justify-end">
              <button 
                onClick={() => setSelectedReceiptImage(null)} 
                className="px-4 py-2 bg-amber-600 hover:bg-amber-700 text-white rounded-xl text-xs font-bold cursor-pointer transition-all"
              >
                بستن رسید
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
