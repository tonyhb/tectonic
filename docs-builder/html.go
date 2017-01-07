package main

import (
	"fmt"
	"os"
	"path"
	"text/template"
)

type HTMLCompiler struct {
	md        MarkdownParser
	raw       RawParser
	outputDir string
}

func NewHTMLCompiler(md MarkdownParser, raw RawParser, outputDir string) *HTMLCompiler {
	return &HTMLCompiler{
		md:        md,
		raw:       raw,
		outputDir: outputDir,
	}
}

func (c *HTMLCompiler) Do(contents []byte, fi os.FileInfo) error {
	file, err := os.OpenFile(path.Join(c.outputDir, fi.Name()), os.O_RDWR|os.O_CREATE|os.O_TRUNC, 0644)
	if err != nil {
		return fmt.Errorf("unable to open file for writing: %s", err)
	}
	defer file.Close()

	// Parse the template.
	return template.
		Must(template.New("").Parse(string(contents))).
		Execute(file, map[string]interface{}{
			"md":       c.md.Parsed,
			"partials": c.raw.Contents,
		})
}
