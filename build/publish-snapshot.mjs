import { spawnSync } from "node:child_process";

function git(args, input) {
  const result = spawnSync("git", args, {
    cwd: process.cwd(),
    encoding: "utf8",
    input,
  });
  if (result.status !== 0) {
    throw new Error(result.stderr || `git ${args.join(" ")} failed`);
  }
  return result.stdout.trim();
}

function treeEntries(revision) {
  const output = git(["ls-tree", revision]);
  return output ? output.split("\n") : [];
}

function makeTree(entries) {
  return git(["mktree"], `${entries.join("\n")}\n`);
}

function replaceTreeEntry(entries, name, treeHash) {
  return [
    ...entries.filter((entry) => !entry.endsWith(`\t${name}`)),
    `040000 tree ${treeHash}\t${name}`,
  ];
}

const rootEntries = treeEntries("HEAD");
const fileEntries = treeEntries("HEAD:files");
const musicListing = git(["ls-tree", "-l", "HEAD:files/music"]);
const music = musicListing.split("\n").map((line) => {
  const match = line.match(/^100644 blob ([0-9a-f]{40})\s+(\d+)\t(.+)$/);
  if (!match) throw new Error(`Unexpected music entry: ${line}`);
  return {
    entry: `100644 blob ${match[1]}\t${match[3]}`,
    bytes: Number(match[2]),
  };
});

const filesWithoutMusic = fileEntries.filter((entry) => !entry.endsWith("\tmusic"));
const baseFilesTree = makeTree(filesWithoutMusic);
const baseRootTree = makeTree(replaceTreeEntry(rootEntries, "files", baseFilesTree));
let previous = git(["commit-tree", baseRootTree, "-m", "Publish NodeShift v2 base"]);
const commits = [{ hash: previous, label: "base", mib: 0 }];

const targetBatchBytes = 48 * 1024 * 1024;
let included = [];
let batch = [];
let batchBytes = 0;
let batchNumber = 0;

function commitBatch() {
  if (batch.length === 0) return;
  included = [...included, ...batch];
  const musicTree = makeTree(included.map((item) => item.entry));
  const filesTree = makeTree(replaceTreeEntry(fileEntries, "music", musicTree));
  const rootTree = makeTree(replaceTreeEntry(rootEntries, "files", filesTree));
  batchNumber += 1;
  previous = git([
    "commit-tree",
    rootTree,
    "-p",
    previous,
    "-m",
    `Publish NodeShift v2 audio batch ${batchNumber}`,
  ]);
  commits.push({
    hash: previous,
    label: `audio-${batchNumber}`,
    mib: Math.round((batchBytes / 1024 / 1024) * 10) / 10,
  });
  batch = [];
  batchBytes = 0;
}

for (const track of music) {
  if (batch.length > 0 && batchBytes + track.bytes > targetBatchBytes) {
    commitBatch();
  }
  batch.push(track);
  batchBytes += track.bytes;
}
commitBatch();

const headTree = git(["rev-parse", "HEAD^{tree}"]);
const finalTree = git(["rev-parse", `${previous}^{tree}`]);
if (headTree !== finalTree) {
  throw new Error("Publication snapshot does not match the current HEAD tree.");
}

process.stdout.write(JSON.stringify({ commits, finalCommit: previous, treeVerified: true }));
