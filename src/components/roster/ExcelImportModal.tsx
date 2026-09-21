import React, { useState } from 'react';
import { Classroom } from '../../types/observation';
import { importStudentsFromRows } from '../../db/schema';
import { downloadFile } from '../../db/exportImport';
import * as XLSX from 'xlsx';
import {
  X,
  Upload,
  Download,
  FileSpreadsheet,
  CheckCircle2,
  AlertCircle,
  Users
} from 'lucide-react';

interface ExcelImportModalProps {
  isOpen: boolean;
  onClose: () => void;
  classrooms: Classroom[];
  onImportSuccess: () => void;
}

interface ParsedStudentRow {
  name: string;
  className: string;
  notes?: string;
  isValid: boolean;
}

export const ExcelImportModal: React.FC<ExcelImportModalProps> = ({
  isOpen,
  onClose,
  classrooms,
  onImportSuccess,
}) => {
  const [file, setFile] = useState<File | null>(null);
  const [parsedRows, setParsedRows] = useState<ParsedStudentRow[]>([]);
  const [importing, setImporting] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  if (!isOpen) return null;

  // Download Sample Template
  const handleDownloadSample = () => {
    const sampleData = [
      ['Student Name', 'Class Name', 'Notes'],
      ['Aarav Reddy', 'Nursery Jnana', 'Enjoys outdoor sand play'],
      ['Diya Sharma', 'Nursery Satya', 'Loves story circles'],
      ['Kavya Nair', 'Nursery Shaurya', 'Quiet and observant'],
      ['Vivaan Patel', 'Nursery Jnana', 'Allergic to milk'],
      ['Anvi Rao', 'Nursery Satya', 'Very helpful with peers']
    ];

    // Create workbook using SheetJS
    const ws = XLSX.utils.aoa_to_sheet(sampleData);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Students');

    // Download as CSV (simple & universal) or XLSX
    const csvOutput = XLSX.utils.sheet_to_csv(ws);
    downloadFile(csvOutput, 'student_onboarding_template.csv', 'text/csv;charset=utf-8;');
  };

  // Handle File Upload and Parse
  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const uploadedFile = e.target.files?.[0];
    if (!uploadedFile) return;

    setFile(uploadedFile);
    setErrorMsg(null);
    setSuccessMsg(null);

    try {
      const data = await uploadedFile.arrayBuffer();
      const workbook = XLSX.read(data, { type: 'array' });
      const firstSheetName = workbook.SheetNames[0];
      const worksheet = workbook.Sheets[firstSheetName];
      const jsonRows: any[] = XLSX.utils.sheet_to_json(worksheet, { defval: '' });

      if (jsonRows.length === 0) {
        setErrorMsg('The uploaded spreadsheet contains no data rows.');
        return;
      }

      // Map rows with fuzzy column matching
      const rows: ParsedStudentRow[] = jsonRows.map((r) => {
        const name = (
          r['Student Name'] ||
          r['student name'] ||
          r['Name'] ||
          r['name'] ||
          r['Student'] ||
          ''
        ).toString().trim();

        const className = (
          r['Class Name'] ||
          r['class name'] ||
          r['Class'] ||
          r['class'] ||
          r['Grade'] ||
          r['grade'] ||
          'Nursery Jnana'
        ).toString().trim();

        const notes = (
          r['Notes'] ||
          r['notes'] ||
          r['Remarks'] ||
          r['remarks'] ||
          r['Parent Contact'] ||
          ''
        ).toString().trim();

        return {
          name,
          className,
          notes: notes || undefined,
          isValid: name.length > 0
        };
      });

      setParsedRows(rows.filter((r) => r.name.length > 0));
    } catch (err: any) {
      console.error('Failed to parse Excel file:', err);
      setErrorMsg(`Failed to parse file: ${err.message || 'Invalid format'}`);
    }
  };

  // Execute Import
  const handleExecuteImport = async () => {
    if (parsedRows.length === 0) return;

    setImporting(true);
    try {
      const result = await importStudentsFromRows(parsedRows);
      setSuccessMsg(
        `Successfully onboarded ${result.added} students across ${result.classroomsAdded > 0 ? `${result.classroomsAdded} new classrooms and ` : ''}existing classrooms!`
      );
      setParsedRows([]);
      setFile(null);
      setTimeout(() => {
        onImportSuccess();
        onClose();
      }, 1800);
    } catch (err: any) {
      setErrorMsg(`Import failed: ${err.message || 'Unknown error'}`);
    } finally {
      setImporting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/70 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4 overflow-y-auto">
      <div className="bg-white rounded-2xl shadow-2xl max-w-xl w-full border border-slate-200 overflow-hidden my-6">
        
        {/* Modal Header */}
        <div className="bg-slate-900 text-white px-5 py-4 flex items-center justify-between border-b border-slate-800">
          <div className="flex items-center space-x-2.5">
            <div className="w-8 h-8 rounded-lg bg-emerald-600 flex items-center justify-center text-white shadow-xs">
              <FileSpreadsheet className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-sm font-bold">Bulk Student Import (Excel / CSV)</h3>
              <p className="text-[11px] text-slate-400">Onboard multiple students at once</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-5 space-y-4 max-h-[75vh] overflow-y-auto">
          
          {/* Step 1: Download Template */}
          <div className="bg-slate-50 border border-slate-200 rounded-xl p-3.5 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
            <div>
              <p className="text-xs font-bold text-slate-900">Step 1: Download Sample Excel Template</p>
              <p className="text-[11px] text-slate-500 mt-0.5">
                Columns: <code className="text-slate-800 font-semibold">Student Name</code>, <code className="text-slate-800 font-semibold">Class Name</code>, <code className="text-slate-800 font-semibold">Notes</code>
              </p>
            </div>
            <button
              type="button"
              onClick={handleDownloadSample}
              className="px-3 py-1.5 rounded-lg bg-white border border-slate-300 hover:bg-slate-100 text-slate-800 text-xs font-bold shadow-2xs flex items-center space-x-1.5 transition-colors self-start sm:self-auto shrink-0"
            >
              <Download className="w-3.5 h-3.5 text-indigo-600" />
              <span>Download Sample CSV</span>
            </button>
          </div>

          {/* Step 2: Upload Excel or CSV */}
          <div className="border-2 border-dashed border-slate-300 rounded-xl p-5 text-center hover:border-indigo-400 transition-colors bg-slate-50/50">
            <Upload className="w-8 h-8 text-slate-400 mx-auto mb-2" />
            <p className="text-xs font-bold text-slate-800">
              Step 2: Choose your Excel (.xlsx, .xls) or CSV file
            </p>
            <p className="text-[11px] text-slate-500 mt-0.5 mb-3">
              Drag and drop or click to browse from your device
            </p>
            <label className="px-4 py-2 rounded-lg bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold shadow-xs cursor-pointer inline-flex items-center space-x-2 transition-colors">
              <Upload className="w-3.5 h-3.5" />
              <span>{file ? file.name : 'Select Spreadsheet File'}</span>
              <input
                type="file"
                accept=".xlsx, .xls, .csv"
                onChange={handleFileChange}
                className="hidden"
              />
            </label>
          </div>

          {/* Feedback messages */}
          {errorMsg && (
            <div className="p-3 bg-rose-50 border border-rose-200 rounded-xl text-xs text-rose-800 flex items-center space-x-2">
              <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
              <span>{errorMsg}</span>
            </div>
          )}

          {successMsg && (
            <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-xl text-xs text-emerald-800 flex items-center space-x-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
              <span>{successMsg}</span>
            </div>
          )}

          {/* Step 3: Preview Table */}
          {parsedRows.length > 0 && (
            <div>
              <div className="flex items-center justify-between mb-2">
                <p className="text-xs font-bold text-slate-900 flex items-center space-x-1.5">
                  <Users className="w-3.5 h-3.5 text-indigo-600" />
                  <span>Ready to Import ({parsedRows.length} Students)</span>
                </p>
                <span className="text-[10px] text-slate-400">Review before confirming</span>
              </div>

              <div className="border border-slate-200 rounded-xl overflow-hidden max-h-48 overflow-y-auto">
                <table className="w-full text-left text-xs">
                  <thead className="bg-slate-100 text-slate-700 border-b border-slate-200 sticky top-0">
                    <tr>
                      <th className="py-2 px-3 font-bold text-[11px]">#</th>
                      <th className="py-2 px-3 font-bold text-[11px]">Student Name</th>
                      <th className="py-2 px-3 font-bold text-[11px]">Classroom</th>
                      <th className="py-2 px-3 font-bold text-[11px]">Notes</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 bg-white">
                    {parsedRows.map((row, idx) => {
                      const matchesExisting = classrooms.some(
                        (c) => c.name.toLowerCase() === row.className.toLowerCase()
                      );

                      return (
                        <tr key={idx} className="hover:bg-slate-50">
                          <td className="py-1.5 px-3 text-slate-400 text-[11px]">{idx + 1}</td>
                          <td className="py-1.5 px-3 font-semibold text-slate-900">{row.name}</td>
                          <td className="py-1.5 px-3">
                            <span
                              className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                                matchesExisting
                                  ? 'bg-indigo-50 text-indigo-700 border border-indigo-200'
                                  : 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                              }`}
                            >
                              {row.className} {!matchesExisting && '(New Class)'}
                            </span>
                          </td>
                          <td className="py-1.5 px-3 text-slate-500 truncate max-w-[120px]">
                            {row.notes || '—'}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>

        {/* Modal Footer */}
        <div className="bg-slate-100 px-5 py-3.5 border-t border-slate-200 flex items-center justify-between">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 rounded-lg text-xs font-semibold text-slate-600 hover:bg-slate-200 transition-colors"
          >
            Cancel
          </button>

          <button
            type="button"
            onClick={handleExecuteImport}
            disabled={parsedRows.length === 0 || importing}
            className="px-5 py-2 rounded-lg text-xs font-bold bg-emerald-600 hover:bg-emerald-700 text-white shadow-sm disabled:opacity-40 disabled:cursor-not-allowed flex items-center space-x-1.5 transition-colors"
          >
            <CheckCircle2 className="w-4 h-4" />
            <span>{importing ? 'Importing...' : `Confirm & Import ${parsedRows.length} Students`}</span>
          </button>
        </div>
      </div>
    </div>
  );
};
