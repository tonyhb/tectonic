package main

import (
	"os"

	"github.com/russross/blackfriday"
)

type MarkdownParser struct {
	// Parsed markdown
	Parsed map[string]string
}

func NewMarkdownParser() *MarkdownParser {
	return &MarkdownParser{
		Parsed: map[string]string{},
	}
}

func (m *MarkdownParser) Do(contents []byte, file os.FileInfo) error {
	m.Parsed[file.Name()] = string(blackfriday.MarkdownCommon(contents))
	return nil
}
