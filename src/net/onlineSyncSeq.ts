let stateSeq = 0
let inputSeq = 0

export function resetOnlineSyncSeq() {
  stateSeq = 0
  inputSeq = 0
}

export function nextStateSeq() {
  stateSeq += 1
  return stateSeq
}

export function nextInputSeq() {
  inputSeq += 1
  return inputSeq
}
