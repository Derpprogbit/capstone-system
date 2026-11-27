/**
 * FILE: src/app/profile/page.js
 * ROUTE: /profile?tab=<profile|dashboard|settings>
 * PURPOSE: Tabbed user hub (?tab=profile, ?tab=dashboard, ?tab=settings) for
 *          editing Full Name/Gender/Location, adding Achievements/Certifications,
 *          viewing received Peer Comments & Ratings, viewing personal Dashboard
 *          metrics, toggling Light/Dark mode, and updating Email/Password.
 * DATA FLOW:
 *   • On mount, loads theme from localStorage, then fetches the current user
 *     session, profile row from public.profiles, ratings from /api/ratings, and
 *     posts from /api/posts.
 *   • Profile tab: edits full_name/gender/location/achievements and saves via
 *     supabase.from("profiles").update().
 *   • Settings tab: toggles theme (localStorage) and updates email/password via
 *     supabase.auth.updateUser().
 * USED BY / CALLED BY: Navbar Profile dropdown (/profile).
 * TROUBLESHOOT: Wrapped in Suspense for Next.js useSearchParams() compatibility.
 *               If data doesn't load, verify schema.sql was executed and
 *               Supabase is configured in .env.local.
 */

"use client";

import { useState, useEffect, Suspense } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import Link from "next/link";
import {
  User,
  LayoutDashboard,
  Settings,
  Award,
  Star,
  Sun,
  Moon,
  Plus,
} from "lucide-react";
import { supabase, isSupabaseConfigured } from "@/lib/supabase";

function ProfileHubContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const activeTab = searchParams.get("tab") || "profile";

  // [STEP 1 - FLOW: Holds the authenticated Supabase Auth user object (or null).
  //  Set by loadData() from supabase.auth.getSession().]
  const [user, setUser] = useState(null);
  // [STEP 2 - FLOW: Holds the matching public.profiles row (or null). Populated
  //  by loadData() and used to pre-fill the profile edit form.]
  const [profile, setProfile] = useState(null);
  // [STEP 3 - FLOW: Holds the array of ratings received by the current user.
  //  Populated by loadData() from GET /api/ratings.]
  const [ratings, setRatings] = useState([]);
  // [STEP 4 - FLOW: Holds the count of posts authored by the current user.
  //  Populated by loadData() from GET /api/posts?authorId=.]
  const [myPostsCount, setMyPostsCount] = useState(0);
  // [STEP 5 - FLOW: Boolean loading flag. true while initial data is being
  //  fetched; false once loadData() completes.]
  const [loading, setLoading] = useState(true);

  // Profile form state
  // [STEP 6 - FLOW: Holds the full name being edited in the profile form.
  //  Updated on keystroke; saved to public.profiles on Save Profile.]
  const [fullName, setFullName] = useState("");
  // [STEP 7 - FLOW: Holds the gender being edited in the profile form.
  //  Updated on keystroke; saved to public.profiles on Save Profile.]
  const [gender, setGender] = useState("");
  // [STEP 8 - FLOW: Holds the location being edited in the profile form.
  //  Updated on keystroke; saved to public.profiles on Save Profile.]
  const [location, setLocation] = useState("");
  // [STEP 9 - FLOW: Holds the array of achievement strings. Items are added via
  //  handleAddAchievement and persisted to public.profiles on Save Profile.]
  const [achievements, setAchievements] = useState([]);
  // [STEP 10 - FLOW: Holds the text typed into the new achievement input.
  //  Cleared after handleAddAchievement adds it to the achievements array.]
  const [newAchievement, setNewAchievement] = useState("");
  // [STEP 11 - FLOW: Holds success/error messages for the profile save form.
  //  Set by handleSaveProfile after the Supabase update completes.]
  const [profileMsg, setProfileMsg] = useState("");

  // Settings form state
  // [STEP 12 - FLOW: Holds the current theme ("light" or "dark"). Toggled by
  //  the Light/Dark mode buttons and persisted to localStorage.]
  const [theme, setTheme] = useState("light");
  // [STEP 13 - FLOW: Holds the new email address typed into the settings form.
  //  Submitted to supabase.auth.updateUser() on Update Credentials.]
  const [newEmail, setNewEmail] = useState("");
  // [STEP 14 - FLOW: Holds the new password typed into the settings form.
  //  Submitted to supabase.auth.updateUser() on Update Credentials.]
  const [newPassword, setNewPassword] = useState("");
  // [STEP 15 - FLOW: Holds success/error messages for the credentials form.
  //  Set by handleUpdateCredentials after the Supabase update completes.]
  const [settingsMsg, setSettingsMsg] = useState("");

  // [STEP 16 - FLOW (useEffect): Loads the saved theme from localStorage on
  //  mount. Reads "kb_theme" (defaults to "light") and sets theme state.]
  useEffect(() => {
    const saved = localStorage.getItem("kb_theme") || "light";
    setTheme(saved);
  }, []);

  // [STEP 17 - FLOW (useEffect): Loads the authenticated user, profile, ratings,
  //  and post count on mount. Calls supabase.auth.getSession() to get the user,
  //  then fetches public.profiles, GET /api/ratings, and GET /api/posts in
  //  parallel via Promise.all.]
  useEffect(() => {
    if (!isSupabaseConfigured) {
      setLoading(false);
      return;
    }

    async function loadData() {
      // [DATA CALL: supabase.auth.getSession() — talks to Supabase Auth to
      //  retrieve the current session. Expects { data: { session: { user } } }.]
      const {
        data: { session },
      } = await supabase.auth.getSession();
      const currentUser = session?.user ?? null;
      setUser(currentUser);

      if (currentUser) {
        setNewEmail(currentUser.email || "");
        const [{ data: prof }, ratingsRes, postsRes] = await Promise.all([
          // [DATA CALL: supabase.from("profiles").select("*").eq("id", ...).single()
          //  — talks to public.profiles. Expects a single profile row matching
          //  the authenticated user's id.]
          supabase.from("profiles").select("*").eq("id", currentUser.id).single(),
          // [DATA CALL: fetch GET /api/ratings?userId=<currentUser.id>
          //  — talks to the /api/ratings GET endpoint, which queries public.ratings
          //  joined with rater profiles. Expects { ratings: [...] } JSON.]
          fetch(`/api/ratings?userId=${encodeURIComponent(currentUser.id)}`),
          // [DATA CALL: fetch GET /api/posts?authorId=<currentUser.id>
          //  — talks to the /api/posts GET endpoint, which queries public.posts
          //  joined with author profiles. Expects { posts: [...] } JSON.]
          fetch(`/api/posts?authorId=${encodeURIComponent(currentUser.id)}`),
        ]);

        if (prof) {
          setProfile(prof);
          setFullName(prof.full_name || "");
          setGender(prof.gender || "");
          setLocation(prof.location || "");
          setAchievements(prof.achievements || []);
        }

        const rData = await ratingsRes.json();
        setRatings(rData.ratings || []);

        const pData = await postsRes.json();
        setMyPostsCount((pData.posts || []).length);
      }
      setLoading(false);
    }

    loadData();
  }, []);

  // [STEP 18 - FLOW (handler): Saves profile updates to public.profiles.
  //  Validates user exists, then calls supabase.from("profiles").update() with
  //  full_name, gender, location, achievements, and updated_at. Shows success
  //  or error message via profileMsg state.]
  async function handleSaveProfile(e) {
    e.preventDefault();
    if (!user) return;
    setProfileMsg("");

    // [DATA CALL: supabase.from("profiles").update({ full_name, gender, location,
    //  achievements, updated_at }).eq("id", user.id)
    //  — talks to public.profiles. Updates the current user's row with the
    //  edited form values. Expects { error } or success.]
    const { error } = await supabase
      .from("profiles")
      .update({
        full_name: fullName.trim(),
        gender: gender.trim(),
        location: location.trim(),
        achievements,
        updated_at: new Date().toISOString(),
      })
      .eq("id", user.id);

    setProfileMsg(error ? error.message : "Profile updated successfully.");
  }

  // [STEP 19 - FLOW (handler): Adds a new achievement to the achievements array.
  //  Validates the input is non-empty, appends the trimmed achievement, and
  //  clears the input field.]
  function handleAddAchievement() {
    if (!newAchievement.trim()) return;
    setAchievements((prev) => [...prev, newAchievement.trim()]);
    setNewAchievement("");
  }

  // [STEP 20 - FLOW (handler): Toggles Light/Dark theme. Sets theme state,
  //  persists to localStorage as "kb_theme", and adds/removes the .dark class
  //  on document.documentElement for Tailwind dark-mode styling.]
  function handleToggleTheme(nextTheme) {
    setTheme(nextTheme);
    localStorage.setItem("kb_theme", nextTheme);
    if (nextTheme === "dark") {
      document.documentElement.classList.add("dark");
    } else {
      document.documentElement.classList.remove("dark");
    }
  }

  // [STEP 21 - FLOW (handler): Updates Supabase Auth email and/or password.
  //  Builds an updates object from newEmail and newPassword (only when changed),
  //  calls supabase.auth.updateUser(updates), and shows success/error via
  //  settingsMsg state.]
  async function handleUpdateCredentials(e) {
    e.preventDefault();
    setSettingsMsg("");
    const updates = {};
    if (newEmail && newEmail !== user?.email) updates.email = newEmail.trim();
    if (newPassword) updates.password = newPassword;

    if (Object.keys(updates).length === 0) {
      setSettingsMsg("No credential changes to save.");
      return;
    }

    // [DATA CALL: supabase.auth.updateUser({ email, password })
    //  — talks to Supabase Auth. Updates the current user's email and/or
    //  password. Expects { error } or success.]
    const { error } = await supabase.auth.updateUser(updates);
    if (error) {
      setSettingsMsg(error.message);
    } else {
      setNewPassword("");
      setSettingsMsg("Account credentials updated.");
    }
  }

  if (loading) {
    return (
      <div className="p-8 text-center text-sm text-slate-500">
        Loading profile hub...
      </div>
    );
  }

  if (!user) {
    return (
      <div className="max-w-md mx-auto mt-12 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-6 text-center">
        <p className="text-sm font-semibold text-slate-800 dark:text-slate-100">
          You are not signed in.
        </p>
        <Link
          href="/login"
          className="inline-block mt-4 px-4 py-2 rounded-lg bg-[#0F4C25] text-white text-sm font-semibold"
        >
          Sign In
        </Link>
      </div>
    );
  }

  const tabs = [
    { id: "profile", label: "My Profile", icon: User },
    { id: "dashboard", label: "Dashboard", icon: LayoutDashboard },
    { id: "settings", label: "Settings & Theme", icon: Settings },
  ];

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Tab Navigation */}
      <div className="flex flex-wrap gap-2 border-b border-slate-200 dark:border-slate-800 pb-3">
        {tabs.map((tab) => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;
          return (
            /* [UI ELEMENT: PROFILE HUB TAB BUTTON - clicking navigates to /profile?tab=<tab.id> (My Profile, Dashboard, or Settings & Theme) and highlights the active tab.] */
            <button
              key={tab.id}
              type="button"
              onClick={() => router.push(`/profile?tab=${tab.id}`)}
              className={`inline-flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-semibold transition-colors ${
                isActive
                  ? "bg-[#0F4C25] text-white"
                  : "bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-300"
              }`}
            >
              <Icon className="w-4 h-4" />
              {tab.label}
            </button>
          );
        })}
      </div>

      {/* TAB 1: MY PROFILE */}
      {activeTab === "profile" && (
        <div className="grid md:grid-cols-12 gap-6">
          <form
            onSubmit={handleSaveProfile}
            className="md:col-span-7 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-5 space-y-4"
          >
            <h2 className="font-bold text-base text-slate-900 dark:text-slate-100">
              Student Profile Details
            </h2>

            <div>
              <label className="block text-xs font-semibold text-slate-600 dark:text-slate-400 mb-1">
                Full Name
              </label>
              {/* [UI ELEMENT: PROFILE FULL NAME INPUT — typing updates fullName
               *  state via setFullName. Submitted to public.profiles on Save
               *  Profile.] */}
              <input
                type="text"
                required
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                className="w-full px-3.5 py-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-950 text-sm"
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-semibold text-slate-600 dark:text-slate-400 mb-1">
                  Gender
                </label>
                {/* [UI ELEMENT: PROFILE GENDER INPUT — typing updates gender
                 *  state via setGender. Submitted to public.profiles on Save
                 *  Profile.] */}
                <input
                  type="text"
                  value={gender}
                  onChange={(e) => setGender(e.target.value)}
                  placeholder="Optional"
                  className="w-full px-3.5 py-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-950 text-sm"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-600 dark:text-slate-400 mb-1">
                  Location
                </label>
                {/* [UI ELEMENT: PROFILE LOCATION INPUT — typing updates location
                 *  state via setLocation. Submitted to public.profiles on Save
                 *  Profile.] */}
                <input
                  type="text"
                  value={location}
                  onChange={(e) => setLocation(e.target.value)}
                  placeholder="e.g. Guagua, Pampanga"
                  className="w-full px-3.5 py-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-950 text-sm"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-600 dark:text-slate-400 mb-1">
                Achievements &amp; Certifications
              </label>
              <div className="flex gap-2">
                {/* [UI ELEMENT: NEW ACHIEVEMENT INPUT — typing updates newAchievement
                 *  state via setNewAchievement. Submitted via the Add Achievement
                 *  button to append to the achievements array.] */}
                <input
                  type="text"
                  value={newAchievement}
                  onChange={(e) => setNewAchievement(e.target.value)}
                  placeholder="e.g. Cisco CCNAv7 Intro"
                  className="flex-1 px-3.5 py-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-950 text-sm"
                />
                {/* [UI ELEMENT: ADD ACHIEVEMENT BUTTON — clicking calls
                 *  handleAddAchievement, which appends the trimmed newAchievement
                 *  to the achievements array and clears the input.] */}
                <button
                  type="button"
                  onClick={handleAddAchievement}
                  className="px-3 py-2 rounded-lg bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 text-xs font-semibold inline-flex items-center gap-1"
                >
                  <Plus className="w-3.5 h-3.5" />
                  Add
                </button>
              </div>

              <div className="mt-2 flex flex-wrap gap-1.5">
                {achievements.map((ach, idx) => (
                  <span
                    key={`${ach}-${idx}`}
                    className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium bg-[#C59B27]/15 text-[#7c5f0c] dark:text-[#e6be4c]"
                  >
                    <Award className="w-3 h-3" />
                    {ach}
                  </span>
                ))}
              </div>
            </div>

            {profileMsg && (
              <p className="text-xs text-[#0F4C25] dark:text-emerald-400">
                {profileMsg}
              </p>
            )}

            {/* [UI ELEMENT: SAVE PROFILE BUTTON — clicking submits the profile
             *  form via handleSaveProfile, which updates public.profiles with
             *  full_name, gender, location, achievements, and updated_at.] */}
            <button
              type="submit"
              className="px-4 py-2 rounded-lg bg-[#0F4C25] hover:bg-[#0b3a1c] text-white text-sm font-semibold"
            >
              Save Profile
            </button>
          </form>

          {/* Received Peer Comments & Ratings */}
          <div className="md:col-span-5 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-5 space-y-3">
            <h2 className="font-bold text-base text-slate-900 dark:text-slate-100 flex items-center gap-2">
              <Star className="w-4 h-4 text-[#C59B27]" />
              Peer Comments &amp; Ratings
            </h2>
            {ratings.length === 0 ? (
              <p className="text-xs text-slate-500 dark:text-slate-400">
                No peer endorsements received yet.
              </p>
            ) : (
              <ul className="space-y-3">
                {ratings.map((r) => (
                  <li
                    key={r.id}
                    className="p-3 rounded-lg bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700"
                  >
                    <div className="flex items-center justify-between text-xs font-semibold">
                      <span>{r.rater?.full_name || "Peer"}</span>
                      <span className="text-[#C59B27]">★ {r.stars}/5</span>
                    </div>
                    {r.comment && (
                      <p className="mt-1 text-xs text-slate-600 dark:text-slate-300">
                        {r.comment}
                      </p>
                    )}
                  </li>
                ))}
              </ul>
            )}
          </div>
        </div>
      )}

      {/* TAB 2: DASHBOARD */}
      {activeTab === "dashboard" && (
        <div className="grid sm:grid-cols-3 gap-4">
          <div className="rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-5">
            <p className="text-xs font-semibold text-slate-500 dark:text-slate-400">
              Trust Score
            </p>
            <p className="mt-1 text-2xl font-bold text-[#0F4C25] dark:text-[#C59B27]">
              ★ {Number(profile?.trust_score || 0).toFixed(2)}
            </p>
          </div>
          <div className="rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-5">
            <p className="text-xs font-semibold text-slate-500 dark:text-slate-400">
              Endorsements Received
            </p>
            <p className="mt-1 text-2xl font-bold text-slate-900 dark:text-slate-100">
              {profile?.ratings_count || 0}
            </p>
          </div>
          <div className="rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-5">
            <p className="text-xs font-semibold text-slate-500 dark:text-slate-400">
              Threads Published
            </p>
            <p className="mt-1 text-2xl font-bold text-slate-900 dark:text-slate-100">
              {myPostsCount}
            </p>
          </div>
        </div>
      )}

      {/* TAB 3: SETTINGS & THEME */}
      {activeTab === "settings" && (
        <div className="grid md:grid-cols-2 gap-6">
          <div className="rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-5 space-y-4">
            <h2 className="font-bold text-base text-slate-900 dark:text-slate-100">
              Appearance
            </h2>
            <div className="flex gap-3">
              {/* [UI ELEMENT: LIGHT MODE BUTTON — clicking calls
               *  handleToggleTheme("light"), which sets theme to "light",
               *  persists to localStorage, and removes the .dark class.] */}
              <button
                type="button"
                onClick={() => handleToggleTheme("light")}
                className={`flex-1 flex items-center justify-center gap-2 py-2.5 rounded-lg border text-sm font-semibold ${
                  theme === "light"
                    ? "border-[#0F4C25] bg-[#0F4C25]/10 text-[#0F4C25]"
                    : "border-slate-200 dark:border-slate-700"
                }`}
              >
                <Sun className="w-4 h-4" />
                Light Mode
              </button>

              {/* [UI ELEMENT: DARK MODE BUTTON — clicking calls
               *  handleToggleTheme("dark"), which sets theme to "dark",
               *  persists to localStorage, and adds the .dark class.] */}
              <button
                type="button"
                onClick={() => handleToggleTheme("dark")}
                className={`flex-1 flex items-center justify-center gap-2 py-2.5 rounded-lg border text-sm font-semibold ${
                  theme === "dark"
                    ? "border-[#C59B27] bg-[#C59B27]/15 text-[#C59B27]"
                    : "border-slate-200 dark:border-slate-700"
                }`}
              >
                <Moon className="w-4 h-4" />
                Dark Mode
              </button>
            </div>
          </div>

          <form
            onSubmit={handleUpdateCredentials}
            className="rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-5 space-y-4"
          >
            <h2 className="font-bold text-base text-slate-900 dark:text-slate-100">
              Account Credentials
            </h2>
            <div>
              <label className="block text-xs font-semibold text-slate-600 dark:text-slate-400 mb-1">
                Email Address
              </label>
              {/* [UI ELEMENT: UPDATE EMAIL INPUT — typing updates newEmail state
               *  via setNewEmail. Submitted to supabase.auth.updateUser() on
               *  Update Credentials if different from the current email.] */}
              <input
                type="email"
                value={newEmail}
                onChange={(e) => setNewEmail(e.target.value)}
                className="w-full px-3.5 py-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-950 text-sm"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-600 dark:text-slate-400 mb-1">
                New Password
              </label>
              {/* [UI ELEMENT: UPDATE PASSWORD INPUT — typing updates newPassword
               *  state via setNewPassword. Submitted to supabase.auth.updateUser()
               *  on Update Credentials if non-empty.] */}
              <input
                type="password"
                minLength={6}
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                placeholder="Leave blank to keep current password"
                className="w-full px-3.5 py-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-950 text-sm"
              />
            </div>
            {settingsMsg && (
              <p className="text-xs text-[#0F4C25] dark:text-emerald-400">
                {settingsMsg}
              </p>
            )}
            {/* [UI ELEMENT: UPDATE CREDENTIALS BUTTON — clicking submits the
             *  credentials form via handleUpdateCredentials, which calls
             *  supabase.auth.updateUser() with the new email and/or password.] */}
            <button
              type="submit"
              className="px-4 py-2 rounded-lg bg-[#0F4C25] hover:bg-[#0b3a1c] text-white text-sm font-semibold"
            >
              Update Credentials
            </button>
          </form>
        </div>
      )}
    </div>
  );
}

export default function ProfilePage() {
  return (
    <Suspense
      fallback={
        <div className="p-8 text-center text-sm text-slate-500">
          Loading profile hub...
        </div>
      }
    >
      <ProfileHubContent />
    </Suspense>
  );
}
