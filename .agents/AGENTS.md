# Documentation Synchronization Rule

Whenever the user prompts with the exact phrase "update docs folder" (or similar explicit commands to update documentation), you MUST adhere to the following workflow:

1. **Synchronization First:** Before making any code changes, bug fixes, or fulfilling the rest of the user's request, immediately analyze the current state of the repository.
2. **Update the Docs:** Regenerate and update the following files inside the `docs/` directory to accurately reflect the codebase:
   - `docs/architecture.md`
   - `docs/api-map.md`
   - `docs/routes.md`
   - `docs/database-map.md`
3. **Execute Primary Task:** Only AFTER the documentation is successfully updated, you may proceed to execute the remainder of the user's request on the project files.





# Skills Catalog & Execution Guidance Rule

Whenever you need to use skills from the `skills` repository to help with any task, follow this workflow:

1. **Read Guidance & Summary First**:
   - Check `c:\Users\Saptarshi\Desktop\MainFolder\Hackathon\jersey-vault\jersey-vault-navneel\v11\jersey-vault\.gemini\antigravity\skills\skills\SKILLS_GUIDANCE.md` for multi-skill routing and orchestration rules.
   - Read `c:\Users\Saptarshi\Desktop\MainFolder\Hackathon\jersey-vault\jersey-vault-navneel\v11\jersey-vault\.gemini\antigravity\skills\skills_summary.xml` to quickly identify the skills and their descriptions without searching through individual folders.
2. **Multi-Skill Orchestration**:
   - When a task requires multiple competencies (e.g. debugging a payment flow with test-driven development and security review), select and co-activate all applicable skills (e.g. `systematic-debugging` + `test-driven-development` + `payment-integration-patterns`).
3. **Execute the Skill**:
   - Navigate directly to `c:\Users\Saptarshi\Desktop\MainFolder\Hackathon\jersey-vault\jersey-vault-navneel\v11\jersey-vault\.gemini\antigravity\skills\skills\<skill_name>\SKILL.md` for each needed skill, read its specific instructions, and apply the required patterns and verification steps.
