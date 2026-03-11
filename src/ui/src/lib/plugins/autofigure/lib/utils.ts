/**
 * AutoFigure Utility Functions
 *
 * XML processing utilities for draw.io integration.
 */

import * as pako from "pako"

/**
 * Wrap XML content with the full mxfile structure required by draw.io.
 * Handles cases where XML is just <root>, <mxGraphModel>, or already has <mxfile>.
 */
export function wrapWithMxFile(xml: string): string {
    if (!xml) {
        return `<mxfile><diagram name="Page-1" id="page-1"><mxGraphModel><root><mxCell id="0"/><mxCell id="1" parent="0"/></root></mxGraphModel></diagram></mxfile>`
    }

    // Already has full structure
    if (xml.includes("<mxfile")) {
        return xml
    }

    // Has mxGraphModel but not mxfile
    if (xml.includes("<mxGraphModel")) {
        return `<mxfile><diagram name="Page-1" id="page-1">${xml}</diagram></mxfile>`
    }

    // Just <root> content - extract inner content and wrap fully
    const rootContent = xml.replace(/<\/?root>/g, "").trim()
    return `<mxfile><diagram name="Page-1" id="page-1"><mxGraphModel><root>${rootContent}</root></mxGraphModel></diagram></mxfile>`
}

/**
 * Extract diagram XML from draw.io export format (SVG with embedded data)
 */
export function extractDiagramXML(xml_svg_string: string): string {
    try {
        const decodeHtmlEntities = (str: string) => {
            const textarea = document.createElement("textarea")
            textarea.innerHTML = str
            return textarea.value
        }

        const decodeSvgDataUrl = (dataUrl: string) => {
            const parts = dataUrl.split(",", 2)
            if (parts.length < 2) {
                throw new Error("Invalid SVG data URL.")
            }
            const meta = parts[0]
            const payload = parts[1]

            if (meta.includes("base64")) {
                return atob(payload)
            }

            return decodeURIComponent(payload)
        }

        // 1. Normalize the SVG string (data URL, raw SVG, or encoded SVG)
        let svgString = xml_svg_string.trim()
        if (svgString.startsWith("data:image/svg+xml")) {
            svgString = decodeSvgDataUrl(svgString)
        }

        const parser = new DOMParser()
        const svgDoc = parser.parseFromString(svgString, "image/svg+xml")
        const svgElement = svgDoc.querySelector("svg")

        if (!svgElement) {
            throw new Error("No SVG element found in the input string.")
        }

        // 2. Extract the embedded XML payload
        const encodedContent = svgElement.getAttribute("content")
        const dataMxGraph = svgElement.getAttribute("data-mxgraph")

        if (!encodedContent && !dataMxGraph) {
            throw new Error("SVG element does not have an embedded diagram payload.")
        }

        let xmlContent = ""
        if (encodedContent) {
            xmlContent = decodeHtmlEntities(encodedContent)
        } else if (dataMxGraph) {
            const decodedJson = decodeHtmlEntities(dataMxGraph)
            const parsed = JSON.parse(decodedJson)
            if (!parsed?.xml) {
                throw new Error("SVG data-mxgraph payload missing XML content.")
            }
            try {
                xmlContent = decodeURIComponent(parsed.xml)
            } catch {
                xmlContent = parsed.xml
            }
        }

        // 3. Parse the XML content
        const xmlDoc = parser.parseFromString(xmlContent, "text/xml")
        const diagramElement = xmlDoc.querySelector("diagram")

        if (!diagramElement) {
            throw new Error("No diagram element found")
        }

        // 4. Extract base64 encoded data
        const base64EncodedData = diagramElement.textContent

        if (!base64EncodedData) {
            throw new Error("No encoded data found in the diagram element")
        }

        // 5. Decode base64 data
        const binaryString = atob(base64EncodedData)

        // 6. Convert binary string to Uint8Array
        const len = binaryString.length
        const bytes = new Uint8Array(len)
        for (let i = 0; i < len; i++) {
            bytes[i] = binaryString.charCodeAt(i)
        }

        // 7. Decompress data using pako
        const decompressedData = pako.inflate(bytes, { windowBits: -15 })

        // 8. Convert the decompressed data to a string
        const decoder = new TextDecoder("utf-8")
        const decodedString = decoder.decode(decompressedData)

        // Decode URL-encoded content
        const urlDecodedString = decodeURIComponent(decodedString)

        return urlDecodedString
    } catch (error) {
        console.error("Error extracting diagram XML:", error)
        throw error
    }
}

/**
 * Validates draw.io XML structure for common issues
 * @returns null if valid, error message string if invalid
 */
export function validateMxCellStructure(xml: string): string | null {
    const parser = new DOMParser()
    const doc = parser.parseFromString(xml, "text/xml")

    // Check for XML parsing errors
    const parseError = doc.querySelector("parsererror")
    if (parseError) {
        return `Invalid XML: The XML contains syntax errors. Please escape special characters: use &lt; for <, &gt; for >, &amp; for &, &quot; for ".`
    }

    const allCells = doc.querySelectorAll("mxCell")
    const cellIds = new Set<string>()
    const duplicateIds: string[] = []
    const nestedCells: string[] = []

    allCells.forEach((cell) => {
        const id = cell.getAttribute("id")

        // Check for duplicate IDs
        if (id) {
            if (cellIds.has(id)) {
                duplicateIds.push(id)
            } else {
                cellIds.add(id)
            }
        }

        // Check for nested mxCell
        if (cell.parentElement?.tagName === "mxCell") {
            nestedCells.push(id || "unknown")
        }
    })

    if (nestedCells.length > 0) {
        return `Invalid XML: Found nested mxCell elements (IDs: ${nestedCells.slice(0, 3).join(", ")}). All mxCell elements must be direct children of <root>.`
    }

    if (duplicateIds.length > 0) {
        return `Invalid XML: Found duplicate cell IDs (${duplicateIds.slice(0, 3).join(", ")}). Each mxCell must have a unique ID.`
    }

    return null
}

/**
 * Insert an image into mxGraph XML as a new cell
 */
export function insertImageIntoXml(xml: string, imageUrl: string, cellId: string): string | null {
    try {
        const parser = new DOMParser()
        const doc = parser.parseFromString(xml, 'text/xml')

        const parseError = doc.querySelector('parsererror')
        if (parseError) {
            console.error('[AutoFigure] XML parse error:', parseError.textContent)
            return null
        }

        let mxGraphModel = doc.querySelector('mxGraphModel')
        if (!mxGraphModel && doc.documentElement.tagName === 'mxGraphModel') {
            mxGraphModel = doc.documentElement
        }

        if (!mxGraphModel) {
            console.error('[AutoFigure] Could not find mxGraphModel in XML')
            return null
        }

        const root = mxGraphModel.querySelector('root')
        if (!root) {
            console.error('[AutoFigure] Could not find root in mxGraphModel')
            return null
        }

        // Create a new mxCell for the image
        const mxCell = doc.createElement('mxCell')
        mxCell.setAttribute('id', cellId)
        mxCell.setAttribute('value', '')
        mxCell.setAttribute('style', `shape=image;image=${imageUrl};imageAspect=0;aspect=fixed;verticalLabelPosition=bottom;verticalAlign=top;`)
        mxCell.setAttribute('vertex', '1')
        mxCell.setAttribute('parent', '1')

        // Create geometry for the cell
        const mxGeometry = doc.createElement('mxGeometry')
        mxGeometry.setAttribute('x', '50')
        mxGeometry.setAttribute('y', '50')
        mxGeometry.setAttribute('width', '150')
        mxGeometry.setAttribute('height', '150')
        mxGeometry.setAttribute('as', 'geometry')

        mxCell.appendChild(mxGeometry)
        root.appendChild(mxCell)

        const serializer = new XMLSerializer()
        return serializer.serializeToString(doc)
    } catch (err) {
        console.error('[AutoFigure] Error inserting image into XML:', err)
        return null
    }
}
