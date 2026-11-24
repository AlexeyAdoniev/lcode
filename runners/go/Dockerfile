FROM golang:1.26-bookworm

ENV CGO_ENABLED=0 \
    GO111MODULE=off \
    GOTOOLCHAIN=local \
    GOTELEMETRY=off \
    GOPROXY=off \
    GOMAXPROCS=2 \
    GOCACHE=/opt/go-cache

COPY runner.go prewarm.go /runner/
RUN go build -p 1 -o /runner/runner /runner/runner.go \
    && go build -p 1 -o /tmp/prewarm /runner/prewarm.go \
    && rm /tmp/prewarm

ENV GOCACHE=/work/cache \
    GOTMPDIR=/work

ENTRYPOINT ["/runner/runner"]
