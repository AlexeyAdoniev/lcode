package main

import (
  "encoding/json"
  "fmt"
  "os"
  "os/exec"
  "syscall"
)

type executionRequest struct {
  Code *string `json:"code"`
  Args []string `json:"args"`
}

func run() error {
  var request executionRequest
  if err := json.NewDecoder(os.Stdin).Decode(&request); err != nil {
    return err
  }
  if request.Code == nil || request.Args == nil {
    return fmt.Errorf("code must be a string and args must be a list of strings")
  }

  // Keep the image cache read-only; compilation can add entries to this copy.
  if err := os.CopyFS(os.Getenv("GOCACHE"), os.DirFS("/opt/go-cache")); err != nil {
    return fmt.Errorf("prepare build cache: %w", err)
  }
  if err := os.WriteFile("/work/main.go", []byte(*request.Code), 0600); err != nil {
    return err
  }

  command := exec.Command("go", "build", "-p", "1", "-o", "/work/solution", "/work/main.go")
  command.Dir = "/work"
  command.Stdout = os.Stdout
  command.Stderr = os.Stderr
  if err := command.Run(); err != nil {
    return err
  }

  // Replace the runner so the solution's exit code and signals pass through.
  return syscall.Exec("/work/solution", append([]string{"/work/solution"}, request.Args...), os.Environ())
}

func main() {
  if err := run(); err != nil {
    fmt.Fprintln(os.Stderr, err)
    os.Exit(1)
  }
}
