/**
 * AutoFigure PDF Extraction Utilities
 *
 * Client-side PDF text extraction using unpdf library.
 * Used for extracting text content from uploaded PDFs for figure generation.
 *
 * @module lib/plugins/autofigure/lib/pdf-extraction
 */

import { extractText, getDocumentProxy } from "unpdf"

// Maximum characters allowed for extracted text
const DEFAULT_MAX_EXTRACTED_CHARS = 150000 // 150k chars
export const MAX_EXTRACTED_CHARS =
    typeof window !== 'undefined'
        ? Number(process.env.NEXT_PUBLIC_MAX_EXTRACTED_CHARS) || DEFAULT_MAX_EXTRACTED_CHARS
        : DEFAULT_MAX_EXTRACTED_CHARS

// Text file extensions we support
const TEXT_EXTENSIONS = [
    ".txt",
    ".md",
    ".markdown",
    ".tex",
    ".json",
    ".csv",
    ".xml",
    ".html",
]

/**
 * Extract text content from a PDF file using client-side unpdf library.
 *
 * @param file - The PDF file to extract text from
 * @returns The extracted text content
 */
export async function extractPdfText(file: File): Promise<string> {
    console.log("[AutoFigure PDF] Starting client-side extraction with unpdf...")
    console.log("[AutoFigure PDF] File name:", file.name, "Size:", file.size)

    try {
        const buffer = await file.arrayBuffer()
        console.log("[AutoFigure PDF] ArrayBuffer obtained, length:", buffer.byteLength)

        const pdf = await getDocumentProxy(new Uint8Array(buffer))
        console.log("[AutoFigure PDF] PDF document loaded, numPages:", pdf.numPages)

        const { text } = await extractText(pdf, { mergePages: true })
        const extractedText = text as string

        console.log("[AutoFigure PDF] Client-side extraction completed, text length:", extractedText.length)

        // Truncate if exceeds max length
        if (extractedText.length > MAX_EXTRACTED_CHARS) {
            console.log("[AutoFigure PDF] Text truncated from", extractedText.length, "to", MAX_EXTRACTED_CHARS)
            return extractedText.substring(0, MAX_EXTRACTED_CHARS) + "\n\n[Content truncated due to length...]"
        }

        return extractedText
    } catch (error) {
        console.error("[AutoFigure PDF] Extraction error:", error)
        throw error
    }
}

/**
 * Check if a file is a PDF
 *
 * @param file - The file to check
 * @returns True if the file is a PDF
 */
export function isPdfFile(file: File): boolean {
    return file.type === "application/pdf" || file.name.toLowerCase().endsWith(".pdf")
}

/**
 * Check if a file is a text file
 *
 * @param file - The file to check
 * @returns True if the file is a text file
 */
export function isTextFile(file: File): boolean {
    const name = file.name.toLowerCase()
    return (
        file.type.startsWith("text/") ||
        file.type === "application/json" ||
        TEXT_EXTENSIONS.some((ext) => name.endsWith(ext))
    )
}

/**
 * Extract text content from a text file
 *
 * @param file - The text file to read
 * @returns The file content as string
 */
export async function extractTextFileContent(file: File): Promise<string> {
    return await file.text()
}

/**
 * Process an uploaded file and extract its text content
 *
 * @param file - The uploaded file
 * @returns Object containing extracted text or error
 */
export async function processUploadedFile(file: File): Promise<{
    success: boolean
    text?: string
    error?: string
}> {
    try {
        if (isPdfFile(file)) {
            const text = await extractPdfText(file)
            if (text && text.trim()) {
                return { success: true, text }
            } else {
                return { success: false, error: "No text could be extracted from the PDF" }
            }
        } else if (isTextFile(file)) {
            const text = await extractTextFileContent(file)
            return { success: true, text }
        } else {
            return { success: false, error: `Unsupported file type: ${file.type || file.name}` }
        }
    } catch (error) {
        console.error("[AutoFigure PDF] processUploadedFile error:", error)
        return { success: false, error: String(error) }
    }
}
