import { existsSync, readdirSync, readFileSync } from 'fs'
import { basename, join, extname, resolve } from 'path'
import { marked } from 'marked'
import { default as matter } from 'gray-matter'
import YAML from 'yaml'

const pages = {}

function generateListHtml(files, basePath) {
    let pages = Object.keys(files).filter(key => key !== 'images' && key !== 'meta')

    const meta = files.meta

    // Sort by date
    pages.sort((a, b) => {
        const dateA = files[a].index.meta.date
        const dateB = files[b].index.meta.date
        if (!dateA || !dateB) {
            return 0
        }
        if (meta.sort_order === 'desc') {
            return dateA < dateB ? 1 : -1
        }
        return dateA < dateB ? -1 : 1
    })

    return pages.map(key => `<li>${files[key].index.meta.date ? files[key].index.meta.date + ' ' : ''}<a href="${basePath}/${key}">${files[key].index.meta.title}</a></li>`)
    .join('')
}

function replacePlaceholders(text, pages) {
    return text.replace(/{{\s*([\w-]+)\s*}}/g, (match, key) => {
        const files = pages[key]
        if (files) {
            return `<ul>${generateListHtml(files, key)}</ul>`
        }
        return match
    })
}

const renderer = {
    text(text) {
        return replacePlaceholders(text, pages)
    }
}

marked.use({ renderer })

function readAllFiles(dir, parentObj = pages) {
    const files = readdirSync(dir, { withFileTypes: true })
    files.forEach(file => {
        if (file.isDirectory()) {
            if (!parentObj[file.name]) {
                parentObj[file.name] = {}
            }
            readAllFiles(join(dir, file.name), parentObj[file.name])
        } else if (extname(file.name) === '.md') {
            const content = readFileSync(join(dir, file.name), 'utf8')
            const filename = basename(file.name, '.md')
            if (filename === 'index') {
                const parsed = matter(content, {
                    engines: {
                        yaml: {
                            parse: YAML.parse,
                            stringify: YAML.stringify
                        }
                    }
                })
                parentObj.index = {
                    source: content,
                    meta: parsed.data,
                    markdown: parsed.content,
                    html: ''
                }
            } else {

                const parsed = matter(content, {
                    engines: {
                        yaml: {
                            parse: YAML.parse,
                            stringify: YAML.stringify
                        }
                    }
                })
                parentObj[filename] = {
                    index: {
                        source: content,
                        meta: parsed.data,
                        markdown: parsed.content,
                        html: ''
                    }
                }
            }
        } else if (extname(file.name) === '.yml') {
            const metaFilePath = join(dir, `meta.yml`)
            parentObj.meta = existsSync(metaFilePath) ? YAML.parse(readFileSync(metaFilePath, 'utf8')) : {}
         } else if (file.name === 'layout.html') {
            const layoutFilePath = join(dir, `layout.html`)
            parentObj.layout = existsSync(layoutFilePath) ? readFileSync(layoutFilePath, 'utf8') : ''
         } else {
            parentObj[file.name] = { path: resolve(dir, file.name) }
        }
    })
}

function parseMarkdownToHtml(obj, siteTitle) {
    for (const key in obj) {
        if (obj.hasOwnProperty(key)) {
            const item = obj[key]

            // Check if the item is a Markdown page
            if (item.hasOwnProperty('markdown') && item.hasOwnProperty('meta')) {
                const html = marked(item.markdown)
                item.html = pages.layout.replaceAll('{{ title }}', `${item.meta.title} - ${siteTitle}`)
                item.html = item.html.replaceAll('{{ content }}', html)
            } else if (typeof item === 'object' && !item.path) {
                // If it is another nested object, call the function recursively
                parseMarkdownToHtml(item, siteTitle)
            }
        }
    }
}

export function generatePages(path, siteTitle) {
    readAllFiles(path)
    parseMarkdownToHtml(pages, siteTitle)
    return pages
}
