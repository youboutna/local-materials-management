# Run Node from the host if present, otherwise from a throwaway node:22-alpine container (no Node needed on the server).
node_run() {
  if command -v node >/dev/null 2>&1; then node "$@"; return; fi
  local args=() a
  for a in "$@"; do [[ "$a" = /* && -e "$a" ]] && args+=("/host$a") || args+=("$a"); done
  docker run --rm --user "$(id -u):$(id -g)" --network none --read-only -v /:/host:ro -w "/host$PWD" node:22-alpine node "${args[@]}"
}
