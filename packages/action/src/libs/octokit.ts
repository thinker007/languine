import { Octokit } from "octokit";

export default async function loadOctokit() {
  return new Octokit({ auth: process.env.GH_TOKEN });
}
