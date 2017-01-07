package main

import (
	"os"
)

type RawParser struct {
	Contents map[string]string
}

func NewRawParser() *RawParser {
	return &RawParser{
		Contents: map[string]string{},
	}
}

func (m *RawParser) Do(contents []byte, file os.FileInfo) error {
	m.Contents[file.Name()] = string(contents)
	return nil
}
