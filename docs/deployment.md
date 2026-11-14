# Hosted Supabase deployment safety

The hosted database was created by running SQL snippets in the Supabase dashboard. It has no verified CLI migration history. The live database state is **UNVERIFIED** until these steps are completed.

Do not run `supabase db push` against the linked hosted project before reconciling its migration history and schema.

1. Link the intended project and inspect its migration history:

   ```sh
   supabase link --project-ref <project-ref>
   supabase migration list --linked
   ```

2. Compare the live schema with migrations `000` through `20`. Review the dashboard SQL and inspect the linked schema diff. Resolve every difference before continuing:

   ```sh
   supabase db diff --linked
   ```

3. Only after confirming that the live schema matches those migrations, record the existing versions as applied:

   ```sh
   supabase migration repair --status applied 000 00 01 02 04 05 07 08 09 10 11 12 13 14 15 16 17 18 19 20
   ```

4. Review the migration list and linked schema diff again. Confirm migrations `21` and later are the only pending changes and inspect each SQL file against the live schema.

5. Apply migrations `21` and later through the SQL editor in order, or use `supabase db push` only after the prior reconciliation and review show that it will apply only those migrations.

6. Run the RLS smoke checks for student and teacher access, submission visibility, result and answer-review views, and the protected profile RPC. Record the outcomes before treating the live schema as verified.
