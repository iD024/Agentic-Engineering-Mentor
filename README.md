# Engineering Workspace OS

A workspace-centric AI framework that turns an AI coding assistant into a long-term engineering mentor.

Instead of answering isolated prompts, the AI works from a persistent **Engineering Workspace** stored inside the repository. It understands the project, creates a learning roadmap, manages engineering sessions, tracks progress, and guides development from the first idea to the finished project.

---

## Philosophy

- 🧑 Human owns the project vision.
- 🤖 AI owns the engineering process.
- 📁 The workspace is permanent; chats are temporary.
- 🎯 Projects are goal-driven.
- 📚 Learning is integrated into building.
- ⚙️ Works with any engineering project—not just web development.

---

## Repository Structure

```text
.ai/
├── WORKSPACE.md          # Engineering Workspace contract
├── workspace.json        # Workspace metadata
├── context/              # Generated workspace artifacts
├── core/                 # Core engineering skills
├── profiles/             # Technology-specific profiles
├── templates/            # Reusable templates
└── docs/                 # Documentation
```

---

## Getting Started

1. Copy the `.ai/` directory into the root of your project.
2. Add any existing documentation to:

```text
.ai/context/project-sources/
```

Examples:

- README
- Requirements
- PDFs
- Architecture diagrams
- Notes
- API specifications
- Design documents

If you don't have documentation, the AI will help you create a `project-context.md` and initialize the workspace.

---

## Starting a Project

Begin every new project with this:

```text
Read `.ai/WORKSPACE.md` and operate exclusively according to the Engineering Workspace OS defined there. Synchronize the workspace, initialize any missing artifacts if needed, then load and resume the project: <Project Name>. Follow the workspace lifecycle and active skills for this repository rather than generic AI behavior.
```

The AI will automatically:

- Analyze project sources
- Build project understanding
- Initialize the workspace
- Generate the curriculum
- Create milestones
- Create the current engineering session
- Resume development where you left off

Next for every session I would recommend use this:

```text
Before beginning this engineering session, load the current Workspace and Session. Follow the Engineering Session exactly as defined. Do not skip ahead, reveal future milestones, or perform today's implementation task unless I explicitly ask you to. Teach only the concepts required for this session, explain today's objective, assign a single implementation task with clear success criteria, then stop and wait for my implementation. After I submit my work, review it, provide feedback, update the workspace artifacts, and only then generate the next task or advance the session.
```


---

## Engineering Workflow

```text
Project Sources
        ↓
Project Understanding
        ↓
Workspace Initialization
        ↓
Curriculum
        ↓
Milestone
        ↓
Engineering Session
        ↓
Implementation
        ↓
Review
        ↓
Workspace Update
```

---

## Multi-Chat Support

The workspace—not the conversation—stores project state.

You can switch between chats at any time. As long as the `.ai/` workspace exists, the AI reconstructs the project state and continues from the current milestone and engineering session.

---

## Goal

Engineering Workspace OS is designed to help you **learn by building**. Rather than generating complete solutions, it acts as a senior engineering mentor that guides you through planning, implementation, review, and long-term project development while reducing dependence on AI over time.