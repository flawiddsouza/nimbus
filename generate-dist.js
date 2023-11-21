import { existsSync, mkdirSync, copyFileSync, writeFileSync, rmSync } from 'fs'
import { join } from 'path'

function createDirectory(basePath) {
    if (!existsSync(basePath)) {
        mkdirSync(basePath, { recursive: true })
    }
}

function copyFile(src, dest) {
    copyFileSync(src, dest)
}

function writeHTMLFile(filePath, content) {
    writeFileSync(filePath, content, 'utf8')
}

function generateDistContent(pages, currentPath = distPath) {
    if (pages.html) {
        // It's HTML content at the root to be written
        const htmlFileName = 'index.html'
        const destPath = join(currentPath, htmlFileName)
        createDirectory(currentPath) // Ensure directory exists before writing
        writeHTMLFile(destPath, pages.html)
    }

    Object.keys(pages).forEach(key => {
        if (key === 'meta') {
            return
        }
        const item = pages[key]
        if (typeof item.path === 'string') {
            // It's a file path, likely an image to be copied
            const destPath = join(currentPath, key)
            copyFile(item.path, destPath)
        } else if (item.html) {
            // It's HTML content to be written
            const htmlFileName = 'index.html'
            const destPath = join(currentPath, htmlFileName)
            createDirectory(currentPath) // Ensure directory exists before writing
            writeHTMLFile(destPath, item.html)
        } else if (typeof item === 'object' && !item.path) {
            // It's a nested directory and content structure
            const subdirPath = join(currentPath, key)
            createDirectory(subdirPath)
            generateDistContent(item, subdirPath)
        }
    })
}

export function generateDist(pages, distPath) {
    // remove the dist folder if it exists
    rmSync(distPath, { recursive: true, force: true })
    generateDistContent(pages, distPath)
}
