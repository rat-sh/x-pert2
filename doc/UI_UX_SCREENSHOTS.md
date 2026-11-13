# Xpert Platform — Complete UI/UX Screenshot Catalog & Audit

This catalog provides an exhaustive inventory of all views, states, modals, pop-ups, and interactive workflows across the **Xpert** application. Every screen was captured from the live application to help evaluate and refine the UI/UX.

---

## Table of Contents
1. [Landing & Authentication Flow](#1-landing--authentication-flow)
2. [Teacher Portal](#2-teacher-portal)
3. [Student Portal](#3-student-portal)
4. [Modals, Pop-ups & Interactive Dialogs](#4-modals-pop-ups--interactive-dialogs)
5. [AI Question Extraction Flow ("Import questions with AI")](#5-ai-question-extraction-flow-import-questions-with-ai)
6. [Key UI/UX Findings & Refinement Recommendations](#6-key-uiux-findings--refinement-recommendations)

---

## 1. Landing & Authentication Flow

### 1.1 Landing / Welcome Screen
- **File:** `doc/screenshots/01_landing_and_auth/01_landing_page.png`
- **Route:** `/`
- **Description:** Clean dual-card portal selector allowing users to choose either "I'm a Teacher" (redirecting to `/login`) or "I'm a Student" (redirecting to `/student/join`).
- **Elements:** App branding, hero subheading, dual role cards with hover states.

### 1.2 Sign In (Default State)
- **File:** `doc/screenshots/01_landing_and_auth/02_login_page_empty.png`
- **Route:** `/login`
- **Description:** Central authentication form for returning users.
- **Elements:** Email field, Password field with password visibility toggle, "Forgot password?" link, "Sign In" CTA button, switch to teacher sign up or student account.

### 1.3 Sign In (Validation Errors)
- **File:** `doc/screenshots/01_landing_and_auth/03_login_validation_errors.png`
- **Route:** `/login`
- **Trigger:** Clicking "Sign In" without inputting credentials.
- **Description:** Displays inline error states for invalid or empty email and password inputs.

### 1.4 Teacher Sign Up (Default State)
- **File:** `doc/screenshots/01_landing_and_auth/04_signup_teacher_empty.png`
- **Route:** `/signup`
- **Description:** Registration form tailored for educators.
- **Elements:** Full Name, Phone (optional), Email address, Subject (optional), Password with eye-toggle, "Create Teacher Account" CTA.

### 1.5 Teacher Sign Up (Validation State)
- **File:** `doc/screenshots/01_landing_and_auth/05_signup_teacher_errors.png`
- **Route:** `/signup`
- **Trigger:** Submitting registration without required fields.
- **Description:** Highlights required inputs in error state.

### 1.6 Forgot Password Screen
- **File:** `doc/screenshots/01_landing_and_auth/06_forgot_password.png`
- **Route:** `/forgot-password`
- **Description:** Password recovery screen with email entry, recovery instructions, and return-to-login navigation.

### 1.7 Student Account Creation / Join (Default)
- **File:** `doc/screenshots/01_landing_and_auth/07_student_join_empty.png`
- **Route:** `/student/join`
- **Description:** Fast signup flow for students to create their profile before enrolling in teacher batches.
- **Elements:** Full Name, Email address, Password (minimum 6 characters), "Create student account" button.

### 1.8 Student Account Creation (Validation State)
- **File:** `doc/screenshots/01_landing_and_auth/08_student_join_errors.png`
- **Route:** `/student/join`
- **Trigger:** Empty form submission.

### 1.9 Sign In (Filled & Show Password Toggle)
- **File:** `doc/screenshots/01_landing_and_auth/09_login_filled_show_password.png`
- **Route:** `/login`
- **Description:** Demonstrates the input state with values populated and the password visibility toggle engaged.

### 1.10 Logout Transition State
- **File:** `doc/screenshots/01_landing_and_auth/10_after_logout.png`
- **Route:** `/login`
- **Description:** Clean redirect back to login following session invalidation.

---

## 2. Teacher Portal

### 2.1 Teacher Dashboard (Light Mode)
- **File:** `doc/screenshots/02_teacher_portal/01_teacher_dashboard.png`
- **Route:** `/teacher`
- **Description:** Main teacher navigation hub featuring greeting, rapid action cards (Create Exam, Question Bank, Upcoming Exams, Results, My Profile), collapsible sidebar, and theme switcher.

### 2.2 Teacher Dashboard (Dark Mode)
- **File:** `doc/screenshots/02_teacher_portal/01_teacher_dashboard_dark.png`
- **Route:** `/teacher`
- **Description:** Full dark theme appearance demonstrating contrast, card elevation, and typography readability in low-light environments.

### 2.3 Calendar & Class Schedule
- **File:** `doc/screenshots/02_teacher_portal/02_calendar_view.png`
- **Route:** `/teacher/calendar`
- **Description:** Interactive monthly calendar view with month navigation controls, "Add Schedule" action button, today/tomorrow class reminders, and scheduled exam highlights.

### 2.4 Exams Management List (Empty State)
- **File:** `doc/screenshots/02_teacher_portal/03_exams_list_page.png`
- **Route:** `/teacher/exams`
- **Description:** Exams repository view with "New Exam" / "Create Exam" CTAs and empty placeholder illustration.

### 2.5 Exam Creator — Step 1: Exam Details
- **File:** `doc/screenshots/02_teacher_portal/04_exam_creator_step1_details.png`
- **Route:** `/teacher/exams` (Wizard Step 1)
- **Description:** Form to configure exam title, subject, target batches, duration (minutes), schedule window, and instant exam toggle.

### 2.6 Exam Creator — Step 1: Instant Exam Toggle
- **File:** `doc/screenshots/02_teacher_portal/05_exam_creator_step1_instant_exam_toggle.png`
- **Route:** `/teacher/exams`
- **Description:** Highlights the switch between scheduled window exams and instant open exams.

### 2.7 Exam Creator — Step 1: Form Filled with Selected Batch
- **File:** `doc/screenshots/02_teacher_portal/09_exam_creator_step1_filled_with_batch.png`
- **Route:** `/teacher/exams`
- **Description:** Complete form filled with valid exam parameters and attached batch before advancing.

### 2.8 Exam Creator — Step 2: Question Paper Builder
- **File:** `doc/screenshots/02_teacher_portal/10_exam_creator_step2_questions_editor.png`
- **Route:** `/teacher/exams` (Wizard Step 2)
- **Description:** Rich multi-question authoring workspace. Features AI-assisted question extraction upload ("Import questions with AI"), section manager, positive/negative marking rules, question type selector, and difficulty tagging (Easy, Medium, Hard, PYQ).

### 2.9 Exam Creator — Question Types Dropdown
- **File:** `doc/screenshots/02_teacher_portal/11_exam_creator_question_types_dropdown.png`
- **Route:** `/teacher/exams`
- **Description:** Demonstrates the question type selection dropdown (Multiple Choice, Single Choice, Numerical, etc.).

### 2.10 Exam Creator — Populated Question & Dynamic Options
- **File:** `doc/screenshots/02_teacher_portal/12_exam_creator_question_filled.png`
- **Route:** `/teacher/exams`
- **Description:** Visual representation of an active question card with custom prompt, options, correct answer assignment, and marks badge.

### 2.11 Exam Creator — Key & PIN Generated Card
- **File:** `doc/screenshots/02_teacher_portal/13_exam_creator_key_generated.png`
- **Route:** `/teacher/exams`
- **Description:** Live exam card created in the repository showcasing status badge ("Scheduled"), duration, question count, Batch tag, Exam Key, and numeric PIN with instant copy actions.

### 2.12 Question Bank Overview
- **File:** `doc/screenshots/02_teacher_portal/14_question_bank_page.png`
- **Route:** `/teacher/bank`
- **Description:** Central archive for reusable question papers, document extraction tool, search filtering, and test paper groups.

### 2.13 Question Bank Exam Detail View
- **File:** `doc/screenshots/02_teacher_portal/15_question_bank_exam_expanded.png`
- **Route:** `/teacher/bank`
- **Description:** Deep inspection view displaying questions and answers stored within an existing paper.

### 2.14 Upcoming Exams
- **File:** `doc/screenshots/02_teacher_portal/16_upcoming_exams_page.png`
- **Route:** `/teacher/upcoming`
- **Description:** Timeline overview of scheduled upcoming assessments.

### 2.15 Teacher Results Dashboard (Initial)
- **File:** `doc/screenshots/02_teacher_portal/17_teacher_results_page.png`
- **Route:** `/teacher/results`
- **Description:** Analytics summary cards (Total Submissions, Average Score, Pass Rate ≥40%) and exam filter buttons.

### 2.16 Teacher Results Dashboard (Live Submissions)
- **File:** `doc/screenshots/02_teacher_portal/24_teacher_results_with_submission.png`
- **Route:** `/teacher/results`
- **Description:** Live data view with student submissions table (Student Name, Exam Name, Batch, Score percentage, Pass/Fail status badge, Submitted timestamp, and Action icons).

### 2.17 Teacher Results — Individual Student Preview Modal
- **File:** `doc/screenshots/02_teacher_portal/25_teacher_student_result_preview_panel.png`
- **Route:** `/teacher/results`
- **Trigger:** Clicking a submission row action.
- **Description:** Detailed performance modal showing student metadata, time taken, score breakdown, per-question correct/incorrect verdict, and PDF export action.

### 2.18 Study Materials Manager (Root)
- **File:** `doc/screenshots/02_teacher_portal/19_study_materials_manager.png`
- **Route:** `/teacher/materials`
- **Description:** File management UI with folder hierarchy tree on the left and content viewer on the right.

### 2.19 Study Materials — Folder Created
- **File:** `doc/screenshots/02_teacher_portal/20_study_materials_folder_created.png`
- **Route:** `/teacher/materials`
- **Description:** Shows folder tree updated with newly created topic folder.

### 2.20 Teacher Profile
- **File:** `doc/screenshots/02_teacher_portal/22_teacher_profile_page.png`
- **Route:** `/teacher/profile`
- **Description:** Profile view showing educator avatar, full name, email, phone number, and account membership metadata.

### 2.21 Batches & Students Manager (Initial)
- **File:** `doc/screenshots/02_teacher_portal/07_batches_empty_page.png`
- **Route:** `/teacher/batches`
- **Description:** Batch management workspace with empty state prompt and "Create Batch" trigger.

### 2.22 Batches & Students Manager (Batch Created)
- **File:** `doc/screenshots/02_teacher_portal/08_batches_with_batch_created.png`
- **Route:** `/teacher/batches`
- **Description:** Active batch card displaying batch name, subject, student enrollment count, unique student join code (e.g. `GRA-HLLF`), copy code button, and batch action controls.

---

## 3. Student Portal

### 3.1 Student Dashboard (Empty State)
- **File:** `doc/screenshots/03_student_portal/01_student_dashboard.png`
- **Route:** `/student`
- **Description:** Student welcoming dashboard with personalized greeting, quick links to "My Exams", "My Results", and "Study Materials", and batch enrollment prompt.

### 3.2 Student Dashboard (Batch Enrolled)
- **File:** `doc/screenshots/03_student_portal/02_student_dashboard_batch_joined.png`
- **Route:** `/student`
- **Description:** Dashboard after enrolling via teacher join code, displaying assigned classes, teacher names, and active batches.

### 3.3 Student Exams List (Ready Assessment Available)
- **File:** `doc/screenshots/03_student_portal/03_student_exams_page.png`
- **Route:** `/student/exams`
- **Description:** Summary metrics (Upcoming: 0, Ready: 1, Completed: 0) and exam card ready to start with subject, duration, marks, and "Start Exam" CTA.

### 3.4 Student Exam Taking — Question Unanswered
- **File:** `doc/screenshots/03_student_portal/05_student_exam_taking_unanswered.png`
- **Route:** `/student/exams`
- **Description:** Full-screen assessment interface. Includes live countdown timer (e.g. `59:52`), question progress indicator (`Question 1 of 1`), section tag, question prompt, marking values (`+1`), radio option selectors, answered counter (`Answered: 0 / 1`), and "Submit Exam" button.

### 3.5 Student Exam Taking — Option Selected
- **File:** `doc/screenshots/03_student_portal/06_student_exam_taking_answered.png`
- **Route:** `/student/exams`
- **Description:** Visual feedback upon selecting an answer option.

### 3.6 Student Exam Taking — Post Submission Status
- **File:** `doc/screenshots/03_student_portal/08_student_exam_submitted_state.png`
- **Route:** `/student/exams`
- **Description:** Exam card shifts to "Completed" with immediate score display (`Score: 0/1`) and disabled action status ("Submitted").

### 3.7 Student Results Page
- **File:** `doc/screenshots/03_student_portal/09_student_results_page.png`
- **Route:** `/student/results`
- **Description:** Tabular log of past exams with Exam Name, Batch, Score, Result status badge (Passed/Failed), and timestamp.

### 3.8 Student Results Detailed Breakdown & Review
- **File:** `doc/screenshots/03_student_portal/10_student_results_detail_expanded.png`
- **Route:** `/student/results`
- **Trigger:** Expanding a results row.
- **Description:** In-depth review panel displaying student's selected answer vs. correct answer, score justification, and "Download Result" PDF button.

### 3.9 Student Study Materials Browser
- **File:** `doc/screenshots/03_student_portal/11_student_study_materials_browser.png`
- **Route:** `/student/materials`
- **Description:** File browser interface for students to access study notes and resources shared by their teachers.

### 3.10 Student Portal (Dark Mode)
- **File:** `doc/screenshots/03_student_portal/12_student_portal_dark_mode.png`
- **Route:** `/student/materials`
- **Description:** Demonstrates the dark theme implementation across the student interface.

### 3.11 Student Exams — AI-Imported Exam Ready
- **File:** `doc/screenshots/03_student_portal/13_student_exams_ai_exam_ready.png`
- **Route:** `/student/exams`
- **Description:** Exam card for "AI Imported - Science & Physics Term Exam" (8 Marks, 6 Questions, 60 mins) displaying the "Start Exam" CTA.

### 3.12 AI Exam Taking — Question 1 (Section A)
- **File:** `doc/screenshots/03_student_portal/14_student_taking_ai_exam_q1.png`
- **Route:** `/student/exams`
- **Description:** Section A: Mechanics & Waves, Question 1 of 6 with +1 mark value, countdown timer at 60:00, and Next button.

### 3.13 AI Exam Taking — Question 2 (Marking & Enabled Back Button)
- **File:** `doc/screenshots/03_student_portal/15_student_taking_ai_exam_q2.png`
- **Route:** `/student/exams`
- **Description:** Question 2 of 6 with +2 mark value, answered counter at 1/6, and enabled Back navigation.

### 3.14 AI Exam Taking — Question 3 (Section B Transition)
- **File:** `doc/screenshots/03_student_portal/16_student_taking_ai_exam_q3_section_b.png`
- **Route:** `/student/exams`
- **Description:** Dynamic section transition banner indicating "SECTION B: MODERN PHYSICS".

### 3.15 AI Exam Taking — Final Question 6 & Submission Trigger
- **File:** `doc/screenshots/03_student_portal/17_student_taking_ai_exam_q6_final.png`
- **Route:** `/student/exams`
- **Description:** Final question card showing the "Submit Exam" button.

### 3.16 Student Dashboard Post-Submission (Perfect 8/8 Score)
- **File:** `doc/screenshots/03_student_portal/18_student_ai_exam_submitted_perfect_score.png`
- **Route:** `/student/exams`
- **Description:** Exam state badge shifts to Completed with immediate green score badge (`Score: 8/8`).

### 3.17 Student Results Log with AI Exam
- **File:** `doc/screenshots/03_student_portal/19_student_results_with_ai_exam.png`
- **Route:** `/student/results`
- **Description:** Results table displaying new row with 8/8 score, Passed status badge, and expandable action trigger.

### 3.18 Student Results Breakdown for AI Exam
- **File:** `doc/screenshots/03_student_portal/20_student_ai_exam_result_breakdown.png`
- **Route:** `/student/results`
- **Description:** Complete question-by-question student answer verification with green correct indicators.

### 3.19 Student Results Scrolled Breakdown View
- **File:** `doc/screenshots/03_student_portal/21_student_ai_exam_result_scrolled.png`
- **Route:** `/student/results`
- **Description:** Scrolled view showing subsequent section questions and verified points.

---

## 4. Modals, Pop-ups & Interactive Dialogs

### 4.1 Calendar: Add Schedule Modal
- **File:** `doc/screenshots/04_modals_and_popups/01_calendar_add_schedule_modal.png`
- **Trigger:** Calendar view → "Add Schedule" button.
- **Description:** Modal dialog to schedule a new Class or Exam with type tabs, batch title input, subject, date, and duration.

### 4.2 Calendar: Add Schedule Modal (Exam Tab Filled)
- **File:** `doc/screenshots/04_modals_and_popups/02_calendar_add_schedule_exam_tab_filled.png`
- **Trigger:** Switching to "Exam" tab inside schedule modal.

### 4.3 Exam Creator: Batch Selector Dropdown
- **File:** `doc/screenshots/04_modals_and_popups/03_exam_creator_batch_selector_dropdown.png`
- **Trigger:** Exam Creator Step 1 → "Select batches…" button.
- **Description:** Dropdown menu for selecting one or more target batches.

### 4.4 Create Batch Modal (Default State)
- **File:** `doc/screenshots/04_modals_and_popups/04_create_batch_modal.png`
- **Trigger:** Batches view → "Create Batch" button.
- **Description:** Modal form for setting Batch Name, Subject, Class Days (Mon-Sun pill toggles), Start Time, and Duration.

### 4.5 Create Batch Modal (Validation State)
- **File:** `doc/screenshots/04_modals_and_popups/05_create_batch_modal_validation.png`
- **Trigger:** Submitting empty batch form.

### 4.6 Create Batch Modal (Filled with Days Selected)
- **File:** `doc/screenshots/04_modals_and_popups/06_create_batch_modal_filled.png`
- **Description:** Demonstrates active day pill toggles (Mon, Wed, Fri) and filled input fields.

### 4.7 Delete Batch Confirmation Dialog
- **File:** `doc/screenshots/04_modals_and_popups/07_delete_batch_confirmation_modal.png`
- **Trigger:** Batch Card → Trash/Delete icon.
- **Description:** Safety alert dialog warning that deleting a batch removes enrollments and calendar schedules.

### 4.8 Exam Creator: Batch Selector with Populated Batches
- **File:** `doc/screenshots/04_modals_and_popups/08_exam_batch_selector_with_batch.png`
- **Trigger:** Batch dropdown open with active batches available for checkbox selection.

### 4.9 Exam Card More Actions Menu
- **File:** `doc/screenshots/04_modals_and_popups/09_exam_card_more_actions_menu.png`
- **Trigger:** Exam Card → "More actions" (`...`) button.
- **Description:** Action menu containing:
  - Edit
  - Update Settings
  - Preview
  - Duplicate
  - Regenerate Key & PIN
  - View Results
  - Archive
  - Delete

### 4.10 Exam Card: Update Settings Modal
- **File:** `doc/screenshots/04_modals_and_popups/10_exam_update_settings_modal.png`
- **Trigger:** More Actions → "Update Settings".
- **Description:** Dialog to adjust exam duration, schedule times, and instant access settings on an existing exam.

### 4.11 Exam Card: Student Preview Modal
- **File:** `doc/screenshots/04_modals_and_popups/11_exam_preview_modal.png`
- **Trigger:** More Actions → "Preview".
- **Description:** Preview overlay simulating how questions, options, and marks will appear to students.

### 4.12 Exam Card: Regenerate Key & PIN Modal
- **File:** `doc/screenshots/04_modals_and_popups/12_exam_regen_key_modal.png`
- **Trigger:** More Actions → "Regenerate Key & PIN".
- **Description:** Safety modal explaining that regenerating credentials invalidates previously distributed keys.

### 4.13 Exam Card: Delete Confirmation Modal
- **File:** `doc/screenshots/04_modals_and_popups/13_exam_delete_confirm_modal.png`
- **Trigger:** More Actions → "Delete".
- **Description:** Destructive action confirmation dialog.

### 4.14 Study Materials: New Folder Modal
- **File:** `doc/screenshots/04_modals_and_popups/14_study_materials_new_folder_modal.png`
- **Trigger:** Study Materials → "New root folder" button.
- **Description:** Input modal with placeholder guide (`e.g. Aptitude → Reasoning`) for hierarchical folder creation.

### 4.15 Student: Batch Status Dropdown
- **File:** `doc/screenshots/04_modals_and_popups/15_student_batch_status_dropdown.png`
- **Trigger:** Student Header → "Batch status" icon button.
- **Description:** Header pop-up showing enrolled batches and "Add another batch" trigger.

### 4.16 Student: Batch Join Code Input
- **File:** `doc/screenshots/04_modals_and_popups/16_student_batch_join_input_open.png`
- **Trigger:** Clicking "Add another batch".
- **Description:** Inline input field with "Enter batch code", Cancel, and Join action buttons.

### 4.17 Student: Batch Join Empty Error State
- **File:** `doc/screenshots/04_modals_and_popups/17_student_batch_join_empty_error.png`
- **Trigger:** Submitting empty batch code.

### 4.18 Student: Batch Join Code Populated
- **File:** `doc/screenshots/04_modals_and_popups/18_student_batch_join_code_entered.png`
- **Description:** Demonstrates entering code `GRA-HLLF`.

---

## 5. AI Question Extraction Flow ("Import questions with AI")

This feature enables teachers to import questions directly from documents (PDF, PNG, JPG, DOCX) using Google Gemini AI, converting unformatted exam documents into structured, interactive exam question papers with sections, options, marks, and answers.

### 5.1 AI Import Banner in Question Bank
- **File:** `doc/screenshots/05_ai_question_extraction/01_question_bank_ai_import_banner.png`
- **Route:** `/teacher/bank`
- **Description:** Dedicated banner component with dashed indigo border, subtitle explaining document format requirements, and prominent "Upload file" CTA with cloud upload icon.

### 5.2 Upload & AI Processing (Spinner State)
- **File:** `doc/screenshots/05_ai_question_extraction/02_ai_extracting_state.png`
- **Route:** `/teacher/bank`
- **Trigger:** Selecting a file for extraction.
- **Description:** Button transitions to disabled state with animated spinner (`LoaderCircle`) and label "Extracting…".

### 5.3 Extraction Complete & Automatic Redirect
- **File:** `doc/screenshots/05_ai_question_extraction/03_ai_extraction_completed_result.png`
- **Route:** Redirects to `/teacher/exams?import=questions`
- **Description:** Toast notification informs user: *"3 questions extracted for review"* and initiates smooth navigation into the Exam Builder.

### 5.4 Exam Details Step (Pre-configured for AI Import)
- **File:** `doc/screenshots/05_ai_question_extraction/04_exam_creator_step1_for_ai_import.png`
- **Route:** `/teacher/exams?import=questions` (Step 1)
- **Description:** Step 1 configuration view with exam rules (Allow PYQ Practice, No Reverse Back, Per Question Timer), title, subject, and assigned batch.

### 5.5 AI-Extracted Questions in Question Paper Builder
- **File:** `doc/screenshots/05_ai_question_extraction/05_ai_extracted_questions_in_builder.png`
- **Route:** `/teacher/exams?import=questions` (Step 2)
- **Description:** All extracted questions populated automatically into editable question cards with question numbers, Section headers, positive/negative marks, and difficulty pills.

### 5.6 Detailed Scrolled View of Extracted Questions
- **File:** `doc/screenshots/05_ai_question_extraction/06_ai_extracted_questions_scrolled_detail.png`
- **Route:** `/teacher/exams?import=questions`
- **Description:** Shows questions 1 and 2 with full options (A, B, C, D) and pre-selected correct answers.

### 5.7 Section 2 & Additional Extracted Questions
- **File:** `doc/screenshots/05_ai_question_extraction/07_ai_extracted_section2_detail.png`
- **Route:** `/teacher/exams?import=questions`
- **Description:** Demonstrates multi-section support where Gemini automatically detected "Section B: Modern Physics" and grouped relevant questions.

### 5.8 AI Extraction Directly Inside Question Builder
- **File:** `doc/screenshots/05_ai_question_extraction/08_ai_extracting_pdf_in_builder.png`
- **Route:** `/teacher/exams`
- **Description:** Shows the inline AI Import banner embedded directly inside the active question editor to append more questions to an ongoing exam.

### 5.9 PDF Document Extraction Success
- **File:** `doc/screenshots/05_ai_question_extraction/09_ai_pdf_extraction_success_in_builder.png`
- **Route:** `/teacher/exams`
- **Description:** Demonstrates PDF parsing and multi-page extraction appending into the question paper tally.

### 5.10 Error Handling: Unsupported File Type Toast
- **File:** `doc/screenshots/05_ai_question_extraction/10_ai_unsupported_file_error_toast.png`
- **Route:** `/teacher/exams`
- **Trigger:** Uploading an unsupported file format (e.g., `.txt`).
- **Description:** Shows client toast notification: *"Unsupported file type. Use a PDF, image, or Word document."*

### 5.11 Saving AI-Imported Exam & Generating Key
- **File:** `doc/screenshots/05_ai_question_extraction/11_ai_imported_exam_key_generated.png`
- **Route:** `/teacher/exams`
- **Description:** Complete exam card generated from AI import with Exam Key (`EXM0P63LQ91MV`), PIN (`543155`), and 6 questions / 8 marks total.

### 5.12 AI Exam Visible in Question Bank Repository
- **File:** `doc/screenshots/05_ai_question_extraction/12_ai_exam_in_question_bank.png`
- **Route:** `/teacher/bank`
- **Description:** Question bank table updated with the new exam, showing total question counts, publication status, and filtering.

### 5.13 Question Bank: Full Extracted Questions Inspection
- **File:** `doc/screenshots/05_ai_question_extraction/13_ai_exam_questions_bank_detail.png`
- **Route:** `/teacher/bank`
- **Description:** Detailed review view inside Question Bank showing all extracted questions with green `✓ Correct` badges next to verified answers.

### 5.14 Question Bank: Scrolled Inspection View
- **File:** `doc/screenshots/05_ai_question_extraction/14_ai_exam_questions_bank_scrolled.png`
- **Route:** `/teacher/bank`
- **Description:** Extended view displaying questions 4 through 6, question type tags, marks, and easy/medium/hard difficulty indicators.

---

## 6. Key UI/UX Findings & Refinement Recommendations

| Area | Current Observation | Recommended UI/UX Refinement |
|---|---|---|
| **AI Import Feedback** | The file input has no drag-and-drop zone. | Add a drag-and-drop target area over the banner so teachers can drag PDFs directly from desktop folders. |
| **AI Progress Feedback** | During multi-page PDF processing (10–15 seconds), only the button text changes to "Extracting…". | Add an animated progress bar or pulsing document skeleton loader so users know the AI model is analyzing their document. |
| **Exam Taking Interface** | Empty option placeholders can appear if options are added without text. | Add client-side validation to strip empty options before saving, or display a warning banner during exam authoring. |
| **Batch Join Dropdown** | The batch status toggle in the student header is an icon-only button without an obvious label for first-time students. | Include a small badge label (e.g. `Join Batch`) or a welcoming onboarding card on empty dashboards. |
| **Exam Card Credentials** | Exam Key and PIN copy buttons are compact icons. | Add tooltip confirmations ("Copied!") on click to reassure teachers that keys are in the clipboard. |
| **Question Builder** | High flexibility with section marks and individual question marks. | Add an automatic marks tally banner at the top showing section subtotals and overall grand total. |
| **Dark Mode** | High contrast dark mode is already implemented across teacher and student layouts. | Add smooth color transitions (`transition-colors duration-200`) when toggling between themes. |
| **Results Modal** | Result preview dialog is informative with breakdown and PDF export. | Add a keyboard shortcut (`Escape`) listener to easily close preview dialogs on desktop. |

