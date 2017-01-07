package main

import (
	"io/ioutil"
	"os"
	"path"
)

type Iterator interface {
	Do(contents []byte, file os.FileInfo) error
}

func IterateDir(loc string, action Iterator) error {
	dir, err := os.Open(loc)
	if err != nil {
		return err
	}

	lstat, err := dir.Readdir(0)
	if err != nil {
		return err
	}

	for _, fi := range lstat {
		if fi.IsDir() {
			continue
		}

		file, err := os.Open(path.Join(loc, fi.Name()))
		defer file.Close()
		if err != nil {
			return err
		}

		contents, err := ioutil.ReadAll(file)
		if err != nil {
			return err
		}

		if err = action.Do(contents, fi); err != nil {
			return err
		}
	}

	return nil
}
