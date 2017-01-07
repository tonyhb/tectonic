package main

import (
	"fmt"
	"os"
)

var (
	markdownDir = "/data/docs/markdown"
	partialsDir = "/data/docs/template/partials"
	templateDir = "/data/docs/template"
	outputDir   = "/data/docs"
)

func main() {
	md := NewMarkdownParser()
	if err := IterateDir(markdownDir, md); err != nil {
		fmt.Printf("error parsing markdown: %s\n", err)
		os.Exit(1)
	}

	raw := NewRawParser()
	if err := IterateDir(partialsDir, raw); err != nil {
		fmt.Printf("error parsing partials: %s\n", err)
		os.Exit(1)
	}

	html := NewHTMLCompiler(*md, *raw, outputDir)
	if err := IterateDir(templateDir, html); err != nil {
		fmt.Printf("error compiling HTML: %s\n", err)
		os.Exit(1)
	}

	fmt.Println("documentation compiled")
}
