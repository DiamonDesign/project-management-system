share-modal.js:1 Uncaught TypeError: Cannot read properties of null (reading 'addEventListener')
    at share-modal.js:1:135
(anonymous) @ share-modal.js:1
setTimeout
(anonymous) @ share-modal.js:1
chunk-3VTW7PKX.js?v=b7030666:21609 Download the React DevTools for a better development experience: https://reactjs.org/link/react-devtools
api-protection.ts:102 [API Protection] {enabled: true, environment: 'development', userAgent: 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) Ap...'}
react-router-dom.js?v=b7030666:4394 ⚠️ React Router Future Flag Warning: React Router will begin wrapping state updates in `React.startTransition` in v7. You can use the `v7_startTransition` future flag to opt-in early. For more information, see https://reactrouter.com/v6/upgrading/future#v7_starttransition.
warnOnce @ react-router-dom.js?v=b7030666:4394
logDeprecation @ react-router-dom.js?v=b7030666:4397
logV6DeprecationWarnings @ react-router-dom.js?v=b7030666:4400
(anonymous) @ react-router-dom.js?v=b7030666:5272
commitHookEffectListMount @ chunk-3VTW7PKX.js?v=b7030666:16963
commitPassiveMountOnFiber @ chunk-3VTW7PKX.js?v=b7030666:18206
commitPassiveMountEffects_complete @ chunk-3VTW7PKX.js?v=b7030666:18179
commitPassiveMountEffects_begin @ chunk-3VTW7PKX.js?v=b7030666:18169
commitPassiveMountEffects @ chunk-3VTW7PKX.js?v=b7030666:18159
flushPassiveEffectsImpl @ chunk-3VTW7PKX.js?v=b7030666:19543
flushPassiveEffects @ chunk-3VTW7PKX.js?v=b7030666:19500
performSyncWorkOnRoot @ chunk-3VTW7PKX.js?v=b7030666:18921
flushSyncCallbacks @ chunk-3VTW7PKX.js?v=b7030666:9166
commitRootImpl @ chunk-3VTW7PKX.js?v=b7030666:19485
commitRoot @ chunk-3VTW7PKX.js?v=b7030666:19330
finishConcurrentRender @ chunk-3VTW7PKX.js?v=b7030666:18858
performConcurrentWorkOnRoot @ chunk-3VTW7PKX.js?v=b7030666:18768
workLoop @ chunk-3VTW7PKX.js?v=b7030666:197
flushWork @ chunk-3VTW7PKX.js?v=b7030666:176
performWorkUntilDeadline @ chunk-3VTW7PKX.js?v=b7030666:384
react-router-dom.js?v=b7030666:4394 ⚠️ React Router Future Flag Warning: Relative route resolution within Splat routes is changing in v7. You can use the `v7_relativeSplatPath` future flag to opt-in early. For more information, see https://reactrouter.com/v6/upgrading/future#v7_relativesplatpath.
warnOnce @ react-router-dom.js?v=b7030666:4394
logDeprecation @ react-router-dom.js?v=b7030666:4397
logV6DeprecationWarnings @ react-router-dom.js?v=b7030666:4403
(anonymous) @ react-router-dom.js?v=b7030666:5272
commitHookEffectListMount @ chunk-3VTW7PKX.js?v=b7030666:16963
commitPassiveMountOnFiber @ chunk-3VTW7PKX.js?v=b7030666:18206
commitPassiveMountEffects_complete @ chunk-3VTW7PKX.js?v=b7030666:18179
commitPassiveMountEffects_begin @ chunk-3VTW7PKX.js?v=b7030666:18169
commitPassiveMountEffects @ chunk-3VTW7PKX.js?v=b7030666:18159
flushPassiveEffectsImpl @ chunk-3VTW7PKX.js?v=b7030666:19543
flushPassiveEffects @ chunk-3VTW7PKX.js?v=b7030666:19500
performSyncWorkOnRoot @ chunk-3VTW7PKX.js?v=b7030666:18921
flushSyncCallbacks @ chunk-3VTW7PKX.js?v=b7030666:9166
commitRootImpl @ chunk-3VTW7PKX.js?v=b7030666:19485
commitRoot @ chunk-3VTW7PKX.js?v=b7030666:19330
finishConcurrentRender @ chunk-3VTW7PKX.js?v=b7030666:18858
performConcurrentWorkOnRoot @ chunk-3VTW7PKX.js?v=b7030666:18768
workLoop @ chunk-3VTW7PKX.js?v=b7030666:197
flushWork @ chunk-3VTW7PKX.js?v=b7030666:176
performWorkUntilDeadline @ chunk-3VTW7PKX.js?v=b7030666:384
logger.ts:97 [SessionContext] User enhancement failed Error: Profile query timeout
    at SessionContext.tsx:81:35
logger.ts:97 [SessionContext] Using basic user due to timeout undefined
dashboard:1 Unchecked runtime.lastError: The message port closed before a response was received.
dashboard:1 Unchecked runtime.lastError: The message port closed before a response was received.
api-protection.ts:74  GET https://nktdqpzxzouxcsvmijvt.supabase.co/rest/v1/tasks?select=*%2Cprojects%21inner%28id%2Cname%2Cuser_id%29&projects.user_id=eq.59e49b27-57ec-4a29-919d-21e856ed6ed0 404 (Not Found)
protectedFetch @ api-protection.ts:74
(anonymous) @ @supabase_supabase-js.js?v=b7030666:4296
(anonymous) @ @supabase_supabase-js.js?v=b7030666:4317
fulfilled @ @supabase_supabase-js.js?v=b7030666:4269
Promise.then
step @ @supabase_supabase-js.js?v=b7030666:4282
(anonymous) @ @supabase_supabase-js.js?v=b7030666:4284
__awaiter6 @ @supabase_supabase-js.js?v=b7030666:4266
(anonymous) @ @supabase_supabase-js.js?v=b7030666:4307
then @ @supabase_supabase-js.js?v=b7030666:90
logger.ts:97 [ProjectContext] Loaded 16 active projects, 1 archived undefined
validation-schemas.ts:107 Validation failed in ProfileQueryResult casting, using fallback: ZodError: [
  {
    "code": "invalid_type",
    "expected": "string",
    "received": "null",
    "path": [
      "data",
      "first_name"
    ],
    "message": "Expected string, received null"
  },
  {
    "code": "invalid_type",
    "expected": "string",
    "received": "null",
    "path": [
      "data",
      "last_name"
    ],
    "message": "Expected string, received null"
  },
  {
    "code": "invalid_type",
    "expected": "string",
    "received": "null",
    "path": [
      "data",
      "avatar_url"
    ],
    "message": "Expected string, received null"
  }
]
    at get error (zod.js?v=b7030666:512:23)
    at ZodNullable.parse (zod.js?v=b7030666:588:18)
    at safeValidateData (validation-schemas.ts:105:19)
    at safeCastToProfileResult (validation-schemas.ts:145:10)
    at enhanceUser (SessionContext.tsx:85:31)
    at async initializeSession (SessionContext.tsx:224:32)
safeValidateData @ validation-schemas.ts:107
safeCastToProfileResult @ validation-schemas.ts:145
enhanceUser @ SessionContext.tsx:85
await in enhanceUser
initializeSession @ SessionContext.tsx:224
await in initializeSession
(anonymous) @ SessionContext.tsx:255
commitHookEffectListMount @ chunk-3VTW7PKX.js?v=b7030666:16963
commitPassiveMountOnFiber @ chunk-3VTW7PKX.js?v=b7030666:18206
commitPassiveMountEffects_complete @ chunk-3VTW7PKX.js?v=b7030666:18179
commitPassiveMountEffects_begin @ chunk-3VTW7PKX.js?v=b7030666:18169
commitPassiveMountEffects @ chunk-3VTW7PKX.js?v=b7030666:18159
flushPassiveEffectsImpl @ chunk-3VTW7PKX.js?v=b7030666:19543
flushPassiveEffects @ chunk-3VTW7PKX.js?v=b7030666:19500
performSyncWorkOnRoot @ chunk-3VTW7PKX.js?v=b7030666:18921
flushSyncCallbacks @ chunk-3VTW7PKX.js?v=b7030666:9166
commitRootImpl @ chunk-3VTW7PKX.js?v=b7030666:19485
commitRoot @ chunk-3VTW7PKX.js?v=b7030666:19330
finishConcurrentRender @ chunk-3VTW7PKX.js?v=b7030666:18858
performConcurrentWorkOnRoot @ chunk-3VTW7PKX.js?v=b7030666:18768
workLoop @ chunk-3VTW7PKX.js?v=b7030666:197
flushWork @ chunk-3VTW7PKX.js?v=b7030666:176
performWorkUntilDeadline @ chunk-3VTW7PKX.js?v=b7030666:384
useOptimizedProjectData.tsx:264 Error fetching optimized project data: Error: AbortError: signal is aborted without reason
    at useOptimizedProjectData.tsx:129:15
(anonymous) @ useOptimizedProjectData.tsx:264
await in (anonymous)
(anonymous) @ useOptimizedProjectData.tsx:274
commitHookEffectListMount @ chunk-3VTW7PKX.js?v=b7030666:16963
commitPassiveMountOnFiber @ chunk-3VTW7PKX.js?v=b7030666:18206
commitPassiveMountEffects_complete @ chunk-3VTW7PKX.js?v=b7030666:18179
commitPassiveMountEffects_begin @ chunk-3VTW7PKX.js?v=b7030666:18169
commitPassiveMountEffects @ chunk-3VTW7PKX.js?v=b7030666:18159
flushPassiveEffectsImpl @ chunk-3VTW7PKX.js?v=b7030666:19543
flushPassiveEffects @ chunk-3VTW7PKX.js?v=b7030666:19500
(anonymous) @ chunk-3VTW7PKX.js?v=b7030666:19381
workLoop @ chunk-3VTW7PKX.js?v=b7030666:197
flushWork @ chunk-3VTW7PKX.js?v=b7030666:176
performWorkUntilDeadline @ chunk-3VTW7PKX.js?v=b7030666:384
api-protection.ts:74  GET https://nktdqpzxzouxcsvmijvt.supabase.co/rest/v1/tasks?select=*%2Cprojects%21inner%28id%2Cname%2Cuser_id%29&projects.user_id=eq.59e49b27-57ec-4a29-919d-21e856ed6ed0 404 (Not Found)
protectedFetch @ api-protection.ts:74
(anonymous) @ @supabase_supabase-js.js?v=b7030666:4296
(anonymous) @ @supabase_supabase-js.js?v=b7030666:4317
fulfilled @ @supabase_supabase-js.js?v=b7030666:4269
Promise.then
step @ @supabase_supabase-js.js?v=b7030666:4282
(anonymous) @ @supabase_supabase-js.js?v=b7030666:4284
__awaiter6 @ @supabase_supabase-js.js?v=b7030666:4266
(anonymous) @ @supabase_supabase-js.js?v=b7030666:4307
then @ @supabase_supabase-js.js?v=b7030666:90
logger.ts:97 [ProjectContext] Loaded 16 active projects, 1 archived undefined
usePWA.tsx:38 [PWA] Service Worker registered successfully: ServiceWorkerRegistration {installing: null, waiting: null, active: ServiceWorker, navigationPreload: NavigationPreloadManager, scope: 'http://localhost:8080/', …}
ProjectCard.tsx:87 Uncaught TypeError: Cannot read properties of undefined (reading 'filter')
    at ProjectCardComponent (ProjectCard.tsx:87:40)
    at renderWithHooks (chunk-3VTW7PKX.js?v=b7030666:11596:26)
    at updateFunctionComponent (chunk-3VTW7PKX.js?v=b7030666:14630:28)
    at updateSimpleMemoComponent (chunk-3VTW7PKX.js?v=b7030666:14511:18)
    at updateMemoComponent (chunk-3VTW7PKX.js?v=b7030666:14414:22)
    at beginWork (chunk-3VTW7PKX.js?v=b7030666:16025:22)
    at HTMLUnknownElement.callCallback2 (chunk-3VTW7PKX.js?v=b7030666:3680:22)
    at Object.invokeGuardedCallbackDev (chunk-3VTW7PKX.js?v=b7030666:3705:24)
    at invokeGuardedCallback (chunk-3VTW7PKX.js?v=b7030666:3739:39)
    at beginWork$1 (chunk-3VTW7PKX.js?v=b7030666:19818:15)
ProjectCardComponent @ ProjectCard.tsx:87
renderWithHooks @ chunk-3VTW7PKX.js?v=b7030666:11596
updateFunctionComponent @ chunk-3VTW7PKX.js?v=b7030666:14630
updateSimpleMemoComponent @ chunk-3VTW7PKX.js?v=b7030666:14511
updateMemoComponent @ chunk-3VTW7PKX.js?v=b7030666:14414
beginWork @ chunk-3VTW7PKX.js?v=b7030666:16025
callCallback2 @ chunk-3VTW7PKX.js?v=b7030666:3680
invokeGuardedCallbackDev @ chunk-3VTW7PKX.js?v=b7030666:3705
invokeGuardedCallback @ chunk-3VTW7PKX.js?v=b7030666:3739
beginWork$1 @ chunk-3VTW7PKX.js?v=b7030666:19818
performUnitOfWork @ chunk-3VTW7PKX.js?v=b7030666:19251
workLoopConcurrent @ chunk-3VTW7PKX.js?v=b7030666:19242
renderRootConcurrent @ chunk-3VTW7PKX.js?v=b7030666:19217
performConcurrentWorkOnRoot @ chunk-3VTW7PKX.js?v=b7030666:18728
workLoop @ chunk-3VTW7PKX.js?v=b7030666:197
flushWork @ chunk-3VTW7PKX.js?v=b7030666:176
performWorkUntilDeadline @ chunk-3VTW7PKX.js?v=b7030666:384
ProjectCard.tsx:87 Uncaught TypeError: Cannot read properties of undefined (reading 'filter')
    at ProjectCardComponent (ProjectCard.tsx:87:40)
    at renderWithHooks (chunk-3VTW7PKX.js?v=b7030666:11596:26)
    at updateFunctionComponent (chunk-3VTW7PKX.js?v=b7030666:14630:28)
    at updateSimpleMemoComponent (chunk-3VTW7PKX.js?v=b7030666:14511:18)
    at updateMemoComponent (chunk-3VTW7PKX.js?v=b7030666:14414:22)
    at beginWork (chunk-3VTW7PKX.js?v=b7030666:16025:22)
    at HTMLUnknownElement.callCallback2 (chunk-3VTW7PKX.js?v=b7030666:3680:22)
    at Object.invokeGuardedCallbackDev (chunk-3VTW7PKX.js?v=b7030666:3705:24)
    at invokeGuardedCallback (chunk-3VTW7PKX.js?v=b7030666:3739:39)
    at beginWork$1 (chunk-3VTW7PKX.js?v=b7030666:19818:15)
ProjectCardComponent @ ProjectCard.tsx:87
renderWithHooks @ chunk-3VTW7PKX.js?v=b7030666:11596
updateFunctionComponent @ chunk-3VTW7PKX.js?v=b7030666:14630
updateSimpleMemoComponent @ chunk-3VTW7PKX.js?v=b7030666:14511
updateMemoComponent @ chunk-3VTW7PKX.js?v=b7030666:14414
beginWork @ chunk-3VTW7PKX.js?v=b7030666:16025
callCallback2 @ chunk-3VTW7PKX.js?v=b7030666:3680
invokeGuardedCallbackDev @ chunk-3VTW7PKX.js?v=b7030666:3705
invokeGuardedCallback @ chunk-3VTW7PKX.js?v=b7030666:3739
beginWork$1 @ chunk-3VTW7PKX.js?v=b7030666:19818
performUnitOfWork @ chunk-3VTW7PKX.js?v=b7030666:19251
workLoopConcurrent @ chunk-3VTW7PKX.js?v=b7030666:19242
renderRootConcurrent @ chunk-3VTW7PKX.js?v=b7030666:19217
performConcurrentWorkOnRoot @ chunk-3VTW7PKX.js?v=b7030666:18728
workLoop @ chunk-3VTW7PKX.js?v=b7030666:197
flushWork @ chunk-3VTW7PKX.js?v=b7030666:176
performWorkUntilDeadline @ chunk-3VTW7PKX.js?v=b7030666:384
ProjectCard.tsx:87 Uncaught TypeError: Cannot read properties of undefined (reading 'filter')
    at ProjectCardComponent (ProjectCard.tsx:87:40)
    at renderWithHooks (chunk-3VTW7PKX.js?v=b7030666:11596:26)
    at updateFunctionComponent (chunk-3VTW7PKX.js?v=b7030666:14630:28)
    at updateSimpleMemoComponent (chunk-3VTW7PKX.js?v=b7030666:14511:18)
    at updateMemoComponent (chunk-3VTW7PKX.js?v=b7030666:14414:22)
    at beginWork (chunk-3VTW7PKX.js?v=b7030666:16025:22)
    at HTMLUnknownElement.callCallback2 (chunk-3VTW7PKX.js?v=b7030666:3680:22)
    at Object.invokeGuardedCallbackDev (chunk-3VTW7PKX.js?v=b7030666:3705:24)
    at invokeGuardedCallback (chunk-3VTW7PKX.js?v=b7030666:3739:39)
    at beginWork$1 (chunk-3VTW7PKX.js?v=b7030666:19818:15)
ProjectCardComponent @ ProjectCard.tsx:87
renderWithHooks @ chunk-3VTW7PKX.js?v=b7030666:11596
updateFunctionComponent @ chunk-3VTW7PKX.js?v=b7030666:14630
updateSimpleMemoComponent @ chunk-3VTW7PKX.js?v=b7030666:14511
updateMemoComponent @ chunk-3VTW7PKX.js?v=b7030666:14414
beginWork @ chunk-3VTW7PKX.js?v=b7030666:16025
callCallback2 @ chunk-3VTW7PKX.js?v=b7030666:3680
invokeGuardedCallbackDev @ chunk-3VTW7PKX.js?v=b7030666:3705
invokeGuardedCallback @ chunk-3VTW7PKX.js?v=b7030666:3739
beginWork$1 @ chunk-3VTW7PKX.js?v=b7030666:19818
performUnitOfWork @ chunk-3VTW7PKX.js?v=b7030666:19251
workLoopConcurrent @ chunk-3VTW7PKX.js?v=b7030666:19242
renderRootConcurrent @ chunk-3VTW7PKX.js?v=b7030666:19217
performConcurrentWorkOnRoot @ chunk-3VTW7PKX.js?v=b7030666:18728
workLoop @ chunk-3VTW7PKX.js?v=b7030666:197
flushWork @ chunk-3VTW7PKX.js?v=b7030666:176
performWorkUntilDeadline @ chunk-3VTW7PKX.js?v=b7030666:384
ProjectCard.tsx:87 Uncaught TypeError: Cannot read properties of undefined (reading 'filter')
    at ProjectCardComponent (ProjectCard.tsx:87:40)
    at renderWithHooks (chunk-3VTW7PKX.js?v=b7030666:11596:26)
    at updateFunctionComponent (chunk-3VTW7PKX.js?v=b7030666:14630:28)
    at updateSimpleMemoComponent (chunk-3VTW7PKX.js?v=b7030666:14511:18)
    at updateMemoComponent (chunk-3VTW7PKX.js?v=b7030666:14414:22)
    at beginWork (chunk-3VTW7PKX.js?v=b7030666:16025:22)
    at HTMLUnknownElement.callCallback2 (chunk-3VTW7PKX.js?v=b7030666:3680:22)
    at Object.invokeGuardedCallbackDev (chunk-3VTW7PKX.js?v=b7030666:3705:24)
    at invokeGuardedCallback (chunk-3VTW7PKX.js?v=b7030666:3739:39)
    at beginWork$1 (chunk-3VTW7PKX.js?v=b7030666:19818:15)
ProjectCardComponent @ ProjectCard.tsx:87
renderWithHooks @ chunk-3VTW7PKX.js?v=b7030666:11596
updateFunctionComponent @ chunk-3VTW7PKX.js?v=b7030666:14630
updateSimpleMemoComponent @ chunk-3VTW7PKX.js?v=b7030666:14511
updateMemoComponent @ chunk-3VTW7PKX.js?v=b7030666:14414
beginWork @ chunk-3VTW7PKX.js?v=b7030666:16025
callCallback2 @ chunk-3VTW7PKX.js?v=b7030666:3680
invokeGuardedCallbackDev @ chunk-3VTW7PKX.js?v=b7030666:3705
invokeGuardedCallback @ chunk-3VTW7PKX.js?v=b7030666:3739
beginWork$1 @ chunk-3VTW7PKX.js?v=b7030666:19818
performUnitOfWork @ chunk-3VTW7PKX.js?v=b7030666:19251
workLoopConcurrent @ chunk-3VTW7PKX.js?v=b7030666:19242
renderRootConcurrent @ chunk-3VTW7PKX.js?v=b7030666:19217
performConcurrentWorkOnRoot @ chunk-3VTW7PKX.js?v=b7030666:18728
workLoop @ chunk-3VTW7PKX.js?v=b7030666:197
flushWork @ chunk-3VTW7PKX.js?v=b7030666:176
performWorkUntilDeadline @ chunk-3VTW7PKX.js?v=b7030666:384
ProjectCard.tsx:87 Uncaught TypeError: Cannot read properties of undefined (reading 'filter')
    at ProjectCardComponent (ProjectCard.tsx:87:40)
    at renderWithHooks (chunk-3VTW7PKX.js?v=b7030666:11596:26)
    at updateFunctionComponent (chunk-3VTW7PKX.js?v=b7030666:14630:28)
    at updateSimpleMemoComponent (chunk-3VTW7PKX.js?v=b7030666:14511:18)
    at updateMemoComponent (chunk-3VTW7PKX.js?v=b7030666:14414:22)
    at beginWork (chunk-3VTW7PKX.js?v=b7030666:16025:22)
    at HTMLUnknownElement.callCallback2 (chunk-3VTW7PKX.js?v=b7030666:3680:22)
    at Object.invokeGuardedCallbackDev (chunk-3VTW7PKX.js?v=b7030666:3705:24)
    at invokeGuardedCallback (chunk-3VTW7PKX.js?v=b7030666:3739:39)
    at beginWork$1 (chunk-3VTW7PKX.js?v=b7030666:19818:15)
ProjectCardComponent @ ProjectCard.tsx:87
renderWithHooks @ chunk-3VTW7PKX.js?v=b7030666:11596
updateFunctionComponent @ chunk-3VTW7PKX.js?v=b7030666:14630
updateSimpleMemoComponent @ chunk-3VTW7PKX.js?v=b7030666:14511
updateMemoComponent @ chunk-3VTW7PKX.js?v=b7030666:14414
beginWork @ chunk-3VTW7PKX.js?v=b7030666:16025
callCallback2 @ chunk-3VTW7PKX.js?v=b7030666:3680
invokeGuardedCallbackDev @ chunk-3VTW7PKX.js?v=b7030666:3705
invokeGuardedCallback @ chunk-3VTW7PKX.js?v=b7030666:3739
beginWork$1 @ chunk-3VTW7PKX.js?v=b7030666:19818
performUnitOfWork @ chunk-3VTW7PKX.js?v=b7030666:19251
workLoopConcurrent @ chunk-3VTW7PKX.js?v=b7030666:19242
renderRootConcurrent @ chunk-3VTW7PKX.js?v=b7030666:19217
performConcurrentWorkOnRoot @ chunk-3VTW7PKX.js?v=b7030666:18728
workLoop @ chunk-3VTW7PKX.js?v=b7030666:197
flushWork @ chunk-3VTW7PKX.js?v=b7030666:176
performWorkUntilDeadline @ chunk-3VTW7PKX.js?v=b7030666:384
ProjectCard.tsx:87 Uncaught TypeError: Cannot read properties of undefined (reading 'filter')
    at ProjectCardComponent (ProjectCard.tsx:87:40)
    at renderWithHooks (chunk-3VTW7PKX.js?v=b7030666:11596:26)
    at updateFunctionComponent (chunk-3VTW7PKX.js?v=b7030666:14630:28)
    at updateSimpleMemoComponent (chunk-3VTW7PKX.js?v=b7030666:14511:18)
    at updateMemoComponent (chunk-3VTW7PKX.js?v=b7030666:14414:22)
    at beginWork (chunk-3VTW7PKX.js?v=b7030666:16025:22)
    at HTMLUnknownElement.callCallback2 (chunk-3VTW7PKX.js?v=b7030666:3680:22)
    at Object.invokeGuardedCallbackDev (chunk-3VTW7PKX.js?v=b7030666:3705:24)
    at invokeGuardedCallback (chunk-3VTW7PKX.js?v=b7030666:3739:39)
    at beginWork$1 (chunk-3VTW7PKX.js?v=b7030666:19818:15)
ProjectCardComponent @ ProjectCard.tsx:87
renderWithHooks @ chunk-3VTW7PKX.js?v=b7030666:11596
updateFunctionComponent @ chunk-3VTW7PKX.js?v=b7030666:14630
updateSimpleMemoComponent @ chunk-3VTW7PKX.js?v=b7030666:14511
updateMemoComponent @ chunk-3VTW7PKX.js?v=b7030666:14414
beginWork @ chunk-3VTW7PKX.js?v=b7030666:16025
callCallback2 @ chunk-3VTW7PKX.js?v=b7030666:3680
invokeGuardedCallbackDev @ chunk-3VTW7PKX.js?v=b7030666:3705
invokeGuardedCallback @ chunk-3VTW7PKX.js?v=b7030666:3739
beginWork$1 @ chunk-3VTW7PKX.js?v=b7030666:19818
performUnitOfWork @ chunk-3VTW7PKX.js?v=b7030666:19251
workLoopConcurrent @ chunk-3VTW7PKX.js?v=b7030666:19242
renderRootConcurrent @ chunk-3VTW7PKX.js?v=b7030666:19217
performConcurrentWorkOnRoot @ chunk-3VTW7PKX.js?v=b7030666:18728
workLoop @ chunk-3VTW7PKX.js?v=b7030666:197
flushWork @ chunk-3VTW7PKX.js?v=b7030666:176
performWorkUntilDeadline @ chunk-3VTW7PKX.js?v=b7030666:384
ProjectCard.tsx:87 Uncaught TypeError: Cannot read properties of undefined (reading 'filter')
    at ProjectCardComponent (ProjectCard.tsx:87:40)
    at renderWithHooks (chunk-3VTW7PKX.js?v=b7030666:11596:26)
    at updateFunctionComponent (chunk-3VTW7PKX.js?v=b7030666:14630:28)
    at updateSimpleMemoComponent (chunk-3VTW7PKX.js?v=b7030666:14511:18)
    at updateMemoComponent (chunk-3VTW7PKX.js?v=b7030666:14414:22)
    at beginWork (chunk-3VTW7PKX.js?v=b7030666:16025:22)
    at HTMLUnknownElement.callCallback2 (chunk-3VTW7PKX.js?v=b7030666:3680:22)
    at Object.invokeGuardedCallbackDev (chunk-3VTW7PKX.js?v=b7030666:3705:24)
    at invokeGuardedCallback (chunk-3VTW7PKX.js?v=b7030666:3739:39)
    at beginWork$1 (chunk-3VTW7PKX.js?v=b7030666:19818:15)
ProjectCardComponent @ ProjectCard.tsx:87
renderWithHooks @ chunk-3VTW7PKX.js?v=b7030666:11596
updateFunctionComponent @ chunk-3VTW7PKX.js?v=b7030666:14630
updateSimpleMemoComponent @ chunk-3VTW7PKX.js?v=b7030666:14511
updateMemoComponent @ chunk-3VTW7PKX.js?v=b7030666:14414
beginWork @ chunk-3VTW7PKX.js?v=b7030666:16025
callCallback2 @ chunk-3VTW7PKX.js?v=b7030666:3680
invokeGuardedCallbackDev @ chunk-3VTW7PKX.js?v=b7030666:3705
invokeGuardedCallback @ chunk-3VTW7PKX.js?v=b7030666:3739
beginWork$1 @ chunk-3VTW7PKX.js?v=b7030666:19818
performUnitOfWork @ chunk-3VTW7PKX.js?v=b7030666:19251
workLoopConcurrent @ chunk-3VTW7PKX.js?v=b7030666:19242
renderRootConcurrent @ chunk-3VTW7PKX.js?v=b7030666:19217
performConcurrentWorkOnRoot @ chunk-3VTW7PKX.js?v=b7030666:18728
workLoop @ chunk-3VTW7PKX.js?v=b7030666:197
flushWork @ chunk-3VTW7PKX.js?v=b7030666:176
performWorkUntilDeadline @ chunk-3VTW7PKX.js?v=b7030666:384
ProjectCard.tsx:87 Uncaught TypeError: Cannot read properties of undefined (reading 'filter')
    at ProjectCardComponent (ProjectCard.tsx:87:40)
    at renderWithHooks (chunk-3VTW7PKX.js?v=b7030666:11596:26)
    at updateFunctionComponent (chunk-3VTW7PKX.js?v=b7030666:14630:28)
    at updateSimpleMemoComponent (chunk-3VTW7PKX.js?v=b7030666:14511:18)
    at updateMemoComponent (chunk-3VTW7PKX.js?v=b7030666:14414:22)
    at beginWork (chunk-3VTW7PKX.js?v=b7030666:16025:22)
    at HTMLUnknownElement.callCallback2 (chunk-3VTW7PKX.js?v=b7030666:3680:22)
    at Object.invokeGuardedCallbackDev (chunk-3VTW7PKX.js?v=b7030666:3705:24)
    at invokeGuardedCallback (chunk-3VTW7PKX.js?v=b7030666:3739:39)
    at beginWork$1 (chunk-3VTW7PKX.js?v=b7030666:19818:15)
ProjectCardComponent @ ProjectCard.tsx:87
renderWithHooks @ chunk-3VTW7PKX.js?v=b7030666:11596
updateFunctionComponent @ chunk-3VTW7PKX.js?v=b7030666:14630
updateSimpleMemoComponent @ chunk-3VTW7PKX.js?v=b7030666:14511
updateMemoComponent @ chunk-3VTW7PKX.js?v=b7030666:14414
beginWork @ chunk-3VTW7PKX.js?v=b7030666:16025
callCallback2 @ chunk-3VTW7PKX.js?v=b7030666:3680
invokeGuardedCallbackDev @ chunk-3VTW7PKX.js?v=b7030666:3705
invokeGuardedCallback @ chunk-3VTW7PKX.js?v=b7030666:3739
beginWork$1 @ chunk-3VTW7PKX.js?v=b7030666:19818
performUnitOfWork @ chunk-3VTW7PKX.js?v=b7030666:19251
workLoopConcurrent @ chunk-3VTW7PKX.js?v=b7030666:19242
renderRootConcurrent @ chunk-3VTW7PKX.js?v=b7030666:19217
performConcurrentWorkOnRoot @ chunk-3VTW7PKX.js?v=b7030666:18728
workLoop @ chunk-3VTW7PKX.js?v=b7030666:197
flushWork @ chunk-3VTW7PKX.js?v=b7030666:176
performWorkUntilDeadline @ chunk-3VTW7PKX.js?v=b7030666:384
ProjectCard.tsx:87 Uncaught TypeError: Cannot read properties of undefined (reading 'filter')
    at ProjectCardComponent (ProjectCard.tsx:87:40)
    at renderWithHooks (chunk-3VTW7PKX.js?v=b7030666:11596:26)
    at updateFunctionComponent (chunk-3VTW7PKX.js?v=b7030666:14630:28)
    at updateSimpleMemoComponent (chunk-3VTW7PKX.js?v=b7030666:14511:18)
    at updateMemoComponent (chunk-3VTW7PKX.js?v=b7030666:14414:22)
    at beginWork (chunk-3VTW7PKX.js?v=b7030666:16025:22)
    at HTMLUnknownElement.callCallback2 (chunk-3VTW7PKX.js?v=b7030666:3680:22)
    at Object.invokeGuardedCallbackDev (chunk-3VTW7PKX.js?v=b7030666:3705:24)
    at invokeGuardedCallback (chunk-3VTW7PKX.js?v=b7030666:3739:39)
    at beginWork$1 (chunk-3VTW7PKX.js?v=b7030666:19818:15)
ProjectCardComponent @ ProjectCard.tsx:87
renderWithHooks @ chunk-3VTW7PKX.js?v=b7030666:11596
updateFunctionComponent @ chunk-3VTW7PKX.js?v=b7030666:14630
updateSimpleMemoComponent @ chunk-3VTW7PKX.js?v=b7030666:14511
updateMemoComponent @ chunk-3VTW7PKX.js?v=b7030666:14414
beginWork @ chunk-3VTW7PKX.js?v=b7030666:16025
callCallback2 @ chunk-3VTW7PKX.js?v=b7030666:3680
invokeGuardedCallbackDev @ chunk-3VTW7PKX.js?v=b7030666:3705
invokeGuardedCallback @ chunk-3VTW7PKX.js?v=b7030666:3739
beginWork$1 @ chunk-3VTW7PKX.js?v=b7030666:19818
performUnitOfWork @ chunk-3VTW7PKX.js?v=b7030666:19251
workLoopConcurrent @ chunk-3VTW7PKX.js?v=b7030666:19242
renderRootConcurrent @ chunk-3VTW7PKX.js?v=b7030666:19217
performConcurrentWorkOnRoot @ chunk-3VTW7PKX.js?v=b7030666:18728
workLoop @ chunk-3VTW7PKX.js?v=b7030666:197
flushWork @ chunk-3VTW7PKX.js?v=b7030666:176
performWorkUntilDeadline @ chunk-3VTW7PKX.js?v=b7030666:384
ProjectCard.tsx:87 Uncaught TypeError: Cannot read properties of undefined (reading 'filter')
    at ProjectCardComponent (ProjectCard.tsx:87:40)
    at renderWithHooks (chunk-3VTW7PKX.js?v=b7030666:11596:26)
    at updateFunctionComponent (chunk-3VTW7PKX.js?v=b7030666:14630:28)
    at updateSimpleMemoComponent (chunk-3VTW7PKX.js?v=b7030666:14511:18)
    at updateMemoComponent (chunk-3VTW7PKX.js?v=b7030666:14414:22)
    at beginWork (chunk-3VTW7PKX.js?v=b7030666:16025:22)
    at HTMLUnknownElement.callCallback2 (chunk-3VTW7PKX.js?v=b7030666:3680:22)
    at Object.invokeGuardedCallbackDev (chunk-3VTW7PKX.js?v=b7030666:3705:24)
    at invokeGuardedCallback (chunk-3VTW7PKX.js?v=b7030666:3739:39)
    at beginWork$1 (chunk-3VTW7PKX.js?v=b7030666:19818:15)
ProjectCardComponent @ ProjectCard.tsx:87
renderWithHooks @ chunk-3VTW7PKX.js?v=b7030666:11596
updateFunctionComponent @ chunk-3VTW7PKX.js?v=b7030666:14630
updateSimpleMemoComponent @ chunk-3VTW7PKX.js?v=b7030666:14511
updateMemoComponent @ chunk-3VTW7PKX.js?v=b7030666:14414
beginWork @ chunk-3VTW7PKX.js?v=b7030666:16025
callCallback2 @ chunk-3VTW7PKX.js?v=b7030666:3680
invokeGuardedCallbackDev @ chunk-3VTW7PKX.js?v=b7030666:3705
invokeGuardedCallback @ chunk-3VTW7PKX.js?v=b7030666:3739
beginWork$1 @ chunk-3VTW7PKX.js?v=b7030666:19818
performUnitOfWork @ chunk-3VTW7PKX.js?v=b7030666:19251
workLoopConcurrent @ chunk-3VTW7PKX.js?v=b7030666:19242
renderRootConcurrent @ chunk-3VTW7PKX.js?v=b7030666:19217
performConcurrentWorkOnRoot @ chunk-3VTW7PKX.js?v=b7030666:18728
workLoop @ chunk-3VTW7PKX.js?v=b7030666:197
flushWork @ chunk-3VTW7PKX.js?v=b7030666:176
performWorkUntilDeadline @ chunk-3VTW7PKX.js?v=b7030666:384
ProjectCard.tsx:87 Uncaught TypeError: Cannot read properties of undefined (reading 'filter')
    at ProjectCardComponent (ProjectCard.tsx:87:40)
    at renderWithHooks (chunk-3VTW7PKX.js?v=b7030666:11596:26)
    at updateFunctionComponent (chunk-3VTW7PKX.js?v=b7030666:14630:28)
    at updateSimpleMemoComponent (chunk-3VTW7PKX.js?v=b7030666:14511:18)
    at updateMemoComponent (chunk-3VTW7PKX.js?v=b7030666:14414:22)
    at beginWork (chunk-3VTW7PKX.js?v=b7030666:16025:22)
    at HTMLUnknownElement.callCallback2 (chunk-3VTW7PKX.js?v=b7030666:3680:22)
    at Object.invokeGuardedCallbackDev (chunk-3VTW7PKX.js?v=b7030666:3705:24)
    at invokeGuardedCallback (chunk-3VTW7PKX.js?v=b7030666:3739:39)
    at beginWork$1 (chunk-3VTW7PKX.js?v=b7030666:19818:15)
ProjectCardComponent @ ProjectCard.tsx:87
renderWithHooks @ chunk-3VTW7PKX.js?v=b7030666:11596
updateFunctionComponent @ chunk-3VTW7PKX.js?v=b7030666:14630
updateSimpleMemoComponent @ chunk-3VTW7PKX.js?v=b7030666:14511
updateMemoComponent @ chunk-3VTW7PKX.js?v=b7030666:14414
beginWork @ chunk-3VTW7PKX.js?v=b7030666:16025
callCallback2 @ chunk-3VTW7PKX.js?v=b7030666:3680
invokeGuardedCallbackDev @ chunk-3VTW7PKX.js?v=b7030666:3705
invokeGuardedCallback @ chunk-3VTW7PKX.js?v=b7030666:3739
beginWork$1 @ chunk-3VTW7PKX.js?v=b7030666:19818
performUnitOfWork @ chunk-3VTW7PKX.js?v=b7030666:19251
workLoopConcurrent @ chunk-3VTW7PKX.js?v=b7030666:19242
renderRootConcurrent @ chunk-3VTW7PKX.js?v=b7030666:19217
performConcurrentWorkOnRoot @ chunk-3VTW7PKX.js?v=b7030666:18728
workLoop @ chunk-3VTW7PKX.js?v=b7030666:197
flushWork @ chunk-3VTW7PKX.js?v=b7030666:176
performWorkUntilDeadline @ chunk-3VTW7PKX.js?v=b7030666:384
ProjectCard.tsx:87 Uncaught TypeError: Cannot read properties of undefined (reading 'filter')
    at ProjectCardComponent (ProjectCard.tsx:87:40)
    at renderWithHooks (chunk-3VTW7PKX.js?v=b7030666:11596:26)
    at updateFunctionComponent (chunk-3VTW7PKX.js?v=b7030666:14630:28)
    at updateSimpleMemoComponent (chunk-3VTW7PKX.js?v=b7030666:14511:18)
    at updateMemoComponent (chunk-3VTW7PKX.js?v=b7030666:14414:22)
    at beginWork (chunk-3VTW7PKX.js?v=b7030666:16025:22)
    at HTMLUnknownElement.callCallback2 (chunk-3VTW7PKX.js?v=b7030666:3680:22)
    at Object.invokeGuardedCallbackDev (chunk-3VTW7PKX.js?v=b7030666:3705:24)
    at invokeGuardedCallback (chunk-3VTW7PKX.js?v=b7030666:3739:39)
    at beginWork$1 (chunk-3VTW7PKX.js?v=b7030666:19818:15)
ProjectCardComponent @ ProjectCard.tsx:87
renderWithHooks @ chunk-3VTW7PKX.js?v=b7030666:11596
updateFunctionComponent @ chunk-3VTW7PKX.js?v=b7030666:14630
updateSimpleMemoComponent @ chunk-3VTW7PKX.js?v=b7030666:14511
updateMemoComponent @ chunk-3VTW7PKX.js?v=b7030666:14414
beginWork @ chunk-3VTW7PKX.js?v=b7030666:16025
callCallback2 @ chunk-3VTW7PKX.js?v=b7030666:3680
invokeGuardedCallbackDev @ chunk-3VTW7PKX.js?v=b7030666:3705
invokeGuardedCallback @ chunk-3VTW7PKX.js?v=b7030666:3739
beginWork$1 @ chunk-3VTW7PKX.js?v=b7030666:19818
performUnitOfWork @ chunk-3VTW7PKX.js?v=b7030666:19251
workLoopConcurrent @ chunk-3VTW7PKX.js?v=b7030666:19242
renderRootConcurrent @ chunk-3VTW7PKX.js?v=b7030666:19217
performConcurrentWorkOnRoot @ chunk-3VTW7PKX.js?v=b7030666:18728
workLoop @ chunk-3VTW7PKX.js?v=b7030666:197
flushWork @ chunk-3VTW7PKX.js?v=b7030666:176
performWorkUntilDeadline @ chunk-3VTW7PKX.js?v=b7030666:384
ProjectCard.tsx:87 Uncaught TypeError: Cannot read properties of undefined (reading 'filter')
    at ProjectCardComponent (ProjectCard.tsx:87:40)
    at renderWithHooks (chunk-3VTW7PKX.js?v=b7030666:11596:26)
    at updateFunctionComponent (chunk-3VTW7PKX.js?v=b7030666:14630:28)
    at updateSimpleMemoComponent (chunk-3VTW7PKX.js?v=b7030666:14511:18)
    at updateMemoComponent (chunk-3VTW7PKX.js?v=b7030666:14414:22)
    at beginWork (chunk-3VTW7PKX.js?v=b7030666:16025:22)
    at HTMLUnknownElement.callCallback2 (chunk-3VTW7PKX.js?v=b7030666:3680:22)
    at Object.invokeGuardedCallbackDev (chunk-3VTW7PKX.js?v=b7030666:3705:24)
    at invokeGuardedCallback (chunk-3VTW7PKX.js?v=b7030666:3739:39)
    at beginWork$1 (chunk-3VTW7PKX.js?v=b7030666:19818:15)
ProjectCardComponent @ ProjectCard.tsx:87
renderWithHooks @ chunk-3VTW7PKX.js?v=b7030666:11596
updateFunctionComponent @ chunk-3VTW7PKX.js?v=b7030666:14630
updateSimpleMemoComponent @ chunk-3VTW7PKX.js?v=b7030666:14511
updateMemoComponent @ chunk-3VTW7PKX.js?v=b7030666:14414
beginWork @ chunk-3VTW7PKX.js?v=b7030666:16025
callCallback2 @ chunk-3VTW7PKX.js?v=b7030666:3680
invokeGuardedCallbackDev @ chunk-3VTW7PKX.js?v=b7030666:3705
invokeGuardedCallback @ chunk-3VTW7PKX.js?v=b7030666:3739
beginWork$1 @ chunk-3VTW7PKX.js?v=b7030666:19818
performUnitOfWork @ chunk-3VTW7PKX.js?v=b7030666:19251
workLoopConcurrent @ chunk-3VTW7PKX.js?v=b7030666:19242
renderRootConcurrent @ chunk-3VTW7PKX.js?v=b7030666:19217
performConcurrentWorkOnRoot @ chunk-3VTW7PKX.js?v=b7030666:18728
workLoop @ chunk-3VTW7PKX.js?v=b7030666:197
flushWork @ chunk-3VTW7PKX.js?v=b7030666:176
performWorkUntilDeadline @ chunk-3VTW7PKX.js?v=b7030666:384
ProjectCard.tsx:87 Uncaught TypeError: Cannot read properties of undefined (reading 'filter')
    at ProjectCardComponent (ProjectCard.tsx:87:40)
    at renderWithHooks (chunk-3VTW7PKX.js?v=b7030666:11596:26)
    at updateFunctionComponent (chunk-3VTW7PKX.js?v=b7030666:14630:28)
    at updateSimpleMemoComponent (chunk-3VTW7PKX.js?v=b7030666:14511:18)
    at updateMemoComponent (chunk-3VTW7PKX.js?v=b7030666:14414:22)
    at beginWork (chunk-3VTW7PKX.js?v=b7030666:16025:22)
    at HTMLUnknownElement.callCallback2 (chunk-3VTW7PKX.js?v=b7030666:3680:22)
    at Object.invokeGuardedCallbackDev (chunk-3VTW7PKX.js?v=b7030666:3705:24)
    at invokeGuardedCallback (chunk-3VTW7PKX.js?v=b7030666:3739:39)
    at beginWork$1 (chunk-3VTW7PKX.js?v=b7030666:19818:15)
ProjectCardComponent @ ProjectCard.tsx:87
renderWithHooks @ chunk-3VTW7PKX.js?v=b7030666:11596
updateFunctionComponent @ chunk-3VTW7PKX.js?v=b7030666:14630
updateSimpleMemoComponent @ chunk-3VTW7PKX.js?v=b7030666:14511
updateMemoComponent @ chunk-3VTW7PKX.js?v=b7030666:14414
beginWork @ chunk-3VTW7PKX.js?v=b7030666:16025
callCallback2 @ chunk-3VTW7PKX.js?v=b7030666:3680
invokeGuardedCallbackDev @ chunk-3VTW7PKX.js?v=b7030666:3705
invokeGuardedCallback @ chunk-3VTW7PKX.js?v=b7030666:3739
beginWork$1 @ chunk-3VTW7PKX.js?v=b7030666:19818
performUnitOfWork @ chunk-3VTW7PKX.js?v=b7030666:19251
workLoopConcurrent @ chunk-3VTW7PKX.js?v=b7030666:19242
renderRootConcurrent @ chunk-3VTW7PKX.js?v=b7030666:19217
performConcurrentWorkOnRoot @ chunk-3VTW7PKX.js?v=b7030666:18728
workLoop @ chunk-3VTW7PKX.js?v=b7030666:197
flushWork @ chunk-3VTW7PKX.js?v=b7030666:176
performWorkUntilDeadline @ chunk-3VTW7PKX.js?v=b7030666:384
ProjectCard.tsx:87 Uncaught TypeError: Cannot read properties of undefined (reading 'filter')
    at ProjectCardComponent (ProjectCard.tsx:87:40)
    at renderWithHooks (chunk-3VTW7PKX.js?v=b7030666:11596:26)
    at updateFunctionComponent (chunk-3VTW7PKX.js?v=b7030666:14630:28)
    at updateSimpleMemoComponent (chunk-3VTW7PKX.js?v=b7030666:14511:18)
    at updateMemoComponent (chunk-3VTW7PKX.js?v=b7030666:14414:22)
    at beginWork (chunk-3VTW7PKX.js?v=b7030666:16025:22)
    at HTMLUnknownElement.callCallback2 (chunk-3VTW7PKX.js?v=b7030666:3680:22)
    at Object.invokeGuardedCallbackDev (chunk-3VTW7PKX.js?v=b7030666:3705:24)
    at invokeGuardedCallback (chunk-3VTW7PKX.js?v=b7030666:3739:39)
    at beginWork$1 (chunk-3VTW7PKX.js?v=b7030666:19818:15)
ProjectCardComponent @ ProjectCard.tsx:87
renderWithHooks @ chunk-3VTW7PKX.js?v=b7030666:11596
updateFunctionComponent @ chunk-3VTW7PKX.js?v=b7030666:14630
updateSimpleMemoComponent @ chunk-3VTW7PKX.js?v=b7030666:14511
updateMemoComponent @ chunk-3VTW7PKX.js?v=b7030666:14414
beginWork @ chunk-3VTW7PKX.js?v=b7030666:16025
callCallback2 @ chunk-3VTW7PKX.js?v=b7030666:3680
invokeGuardedCallbackDev @ chunk-3VTW7PKX.js?v=b7030666:3705
invokeGuardedCallback @ chunk-3VTW7PKX.js?v=b7030666:3739
beginWork$1 @ chunk-3VTW7PKX.js?v=b7030666:19818
performUnitOfWork @ chunk-3VTW7PKX.js?v=b7030666:19251
workLoopConcurrent @ chunk-3VTW7PKX.js?v=b7030666:19242
renderRootConcurrent @ chunk-3VTW7PKX.js?v=b7030666:19217
performConcurrentWorkOnRoot @ chunk-3VTW7PKX.js?v=b7030666:18728
workLoop @ chunk-3VTW7PKX.js?v=b7030666:197
flushWork @ chunk-3VTW7PKX.js?v=b7030666:176
performWorkUntilDeadline @ chunk-3VTW7PKX.js?v=b7030666:384
ProjectCard.tsx:87 Uncaught TypeError: Cannot read properties of undefined (reading 'filter')
    at ProjectCardComponent (ProjectCard.tsx:87:40)
    at renderWithHooks (chunk-3VTW7PKX.js?v=b7030666:11596:26)
    at updateFunctionComponent (chunk-3VTW7PKX.js?v=b7030666:14630:28)
    at updateSimpleMemoComponent (chunk-3VTW7PKX.js?v=b7030666:14511:18)
    at updateMemoComponent (chunk-3VTW7PKX.js?v=b7030666:14414:22)
    at beginWork (chunk-3VTW7PKX.js?v=b7030666:16025:22)
    at HTMLUnknownElement.callCallback2 (chunk-3VTW7PKX.js?v=b7030666:3680:22)
    at Object.invokeGuardedCallbackDev (chunk-3VTW7PKX.js?v=b7030666:3705:24)
    at invokeGuardedCallback (chunk-3VTW7PKX.js?v=b7030666:3739:39)
    at beginWork$1 (chunk-3VTW7PKX.js?v=b7030666:19818:15)
ProjectCardComponent @ ProjectCard.tsx:87
renderWithHooks @ chunk-3VTW7PKX.js?v=b7030666:11596
updateFunctionComponent @ chunk-3VTW7PKX.js?v=b7030666:14630
updateSimpleMemoComponent @ chunk-3VTW7PKX.js?v=b7030666:14511
updateMemoComponent @ chunk-3VTW7PKX.js?v=b7030666:14414
beginWork @ chunk-3VTW7PKX.js?v=b7030666:16025
callCallback2 @ chunk-3VTW7PKX.js?v=b7030666:3680
invokeGuardedCallbackDev @ chunk-3VTW7PKX.js?v=b7030666:3705
invokeGuardedCallback @ chunk-3VTW7PKX.js?v=b7030666:3739
beginWork$1 @ chunk-3VTW7PKX.js?v=b7030666:19818
performUnitOfWork @ chunk-3VTW7PKX.js?v=b7030666:19251
workLoopConcurrent @ chunk-3VTW7PKX.js?v=b7030666:19242
renderRootConcurrent @ chunk-3VTW7PKX.js?v=b7030666:19217
performConcurrentWorkOnRoot @ chunk-3VTW7PKX.js?v=b7030666:18728
workLoop @ chunk-3VTW7PKX.js?v=b7030666:197
flushWork @ chunk-3VTW7PKX.js?v=b7030666:176
performWorkUntilDeadline @ chunk-3VTW7PKX.js?v=b7030666:384
ProjectCard.tsx:87 Uncaught TypeError: Cannot read properties of undefined (reading 'filter')
    at ProjectCardComponent (ProjectCard.tsx:87:40)
    at renderWithHooks (chunk-3VTW7PKX.js?v=b7030666:11596:26)
    at updateFunctionComponent (chunk-3VTW7PKX.js?v=b7030666:14630:28)
    at updateSimpleMemoComponent (chunk-3VTW7PKX.js?v=b7030666:14511:18)
    at updateMemoComponent (chunk-3VTW7PKX.js?v=b7030666:14414:22)
    at beginWork (chunk-3VTW7PKX.js?v=b7030666:16025:22)
    at HTMLUnknownElement.callCallback2 (chunk-3VTW7PKX.js?v=b7030666:3680:22)
    at Object.invokeGuardedCallbackDev (chunk-3VTW7PKX.js?v=b7030666:3705:24)
    at invokeGuardedCallback (chunk-3VTW7PKX.js?v=b7030666:3739:39)
    at beginWork$1 (chunk-3VTW7PKX.js?v=b7030666:19818:15)
ProjectCardComponent @ ProjectCard.tsx:87
renderWithHooks @ chunk-3VTW7PKX.js?v=b7030666:11596
updateFunctionComponent @ chunk-3VTW7PKX.js?v=b7030666:14630
updateSimpleMemoComponent @ chunk-3VTW7PKX.js?v=b7030666:14511
updateMemoComponent @ chunk-3VTW7PKX.js?v=b7030666:14414
beginWork @ chunk-3VTW7PKX.js?v=b7030666:16025
callCallback2 @ chunk-3VTW7PKX.js?v=b7030666:3680
invokeGuardedCallbackDev @ chunk-3VTW7PKX.js?v=b7030666:3705
invokeGuardedCallback @ chunk-3VTW7PKX.js?v=b7030666:3739
beginWork$1 @ chunk-3VTW7PKX.js?v=b7030666:19818
performUnitOfWork @ chunk-3VTW7PKX.js?v=b7030666:19251
workLoopSync @ chunk-3VTW7PKX.js?v=b7030666:19190
renderRootSync @ chunk-3VTW7PKX.js?v=b7030666:19169
recoverFromConcurrentError @ chunk-3VTW7PKX.js?v=b7030666:18786
performConcurrentWorkOnRoot @ chunk-3VTW7PKX.js?v=b7030666:18734
workLoop @ chunk-3VTW7PKX.js?v=b7030666:197
flushWork @ chunk-3VTW7PKX.js?v=b7030666:176
performWorkUntilDeadline @ chunk-3VTW7PKX.js?v=b7030666:384
ProjectCard.tsx:87 Uncaught TypeError: Cannot read properties of undefined (reading 'filter')
    at ProjectCardComponent (ProjectCard.tsx:87:40)
    at renderWithHooks (chunk-3VTW7PKX.js?v=b7030666:11596:26)
    at updateFunctionComponent (chunk-3VTW7PKX.js?v=b7030666:14630:28)
    at updateSimpleMemoComponent (chunk-3VTW7PKX.js?v=b7030666:14511:18)
    at updateMemoComponent (chunk-3VTW7PKX.js?v=b7030666:14414:22)
    at beginWork (chunk-3VTW7PKX.js?v=b7030666:16025:22)
    at HTMLUnknownElement.callCallback2 (chunk-3VTW7PKX.js?v=b7030666:3680:22)
    at Object.invokeGuardedCallbackDev (chunk-3VTW7PKX.js?v=b7030666:3705:24)
    at invokeGuardedCallback (chunk-3VTW7PKX.js?v=b7030666:3739:39)
    at beginWork$1 (chunk-3VTW7PKX.js?v=b7030666:19818:15)
ProjectCardComponent @ ProjectCard.tsx:87
renderWithHooks @ chunk-3VTW7PKX.js?v=b7030666:11596
updateFunctionComponent @ chunk-3VTW7PKX.js?v=b7030666:14630
updateSimpleMemoComponent @ chunk-3VTW7PKX.js?v=b7030666:14511
updateMemoComponent @ chunk-3VTW7PKX.js?v=b7030666:14414
beginWork @ chunk-3VTW7PKX.js?v=b7030666:16025
callCallback2 @ chunk-3VTW7PKX.js?v=b7030666:3680
invokeGuardedCallbackDev @ chunk-3VTW7PKX.js?v=b7030666:3705
invokeGuardedCallback @ chunk-3VTW7PKX.js?v=b7030666:3739
beginWork$1 @ chunk-3VTW7PKX.js?v=b7030666:19818
performUnitOfWork @ chunk-3VTW7PKX.js?v=b7030666:19251
workLoopSync @ chunk-3VTW7PKX.js?v=b7030666:19190
renderRootSync @ chunk-3VTW7PKX.js?v=b7030666:19169
recoverFromConcurrentError @ chunk-3VTW7PKX.js?v=b7030666:18786
performConcurrentWorkOnRoot @ chunk-3VTW7PKX.js?v=b7030666:18734
workLoop @ chunk-3VTW7PKX.js?v=b7030666:197
flushWork @ chunk-3VTW7PKX.js?v=b7030666:176
performWorkUntilDeadline @ chunk-3VTW7PKX.js?v=b7030666:384
ProjectCard.tsx:87 Uncaught TypeError: Cannot read properties of undefined (reading 'filter')
    at ProjectCardComponent (ProjectCard.tsx:87:40)
    at renderWithHooks (chunk-3VTW7PKX.js?v=b7030666:11596:26)
    at updateFunctionComponent (chunk-3VTW7PKX.js?v=b7030666:14630:28)
    at updateSimpleMemoComponent (chunk-3VTW7PKX.js?v=b7030666:14511:18)
    at updateMemoComponent (chunk-3VTW7PKX.js?v=b7030666:14414:22)
    at beginWork (chunk-3VTW7PKX.js?v=b7030666:16025:22)
    at HTMLUnknownElement.callCallback2 (chunk-3VTW7PKX.js?v=b7030666:3680:22)
    at Object.invokeGuardedCallbackDev (chunk-3VTW7PKX.js?v=b7030666:3705:24)
    at invokeGuardedCallback (chunk-3VTW7PKX.js?v=b7030666:3739:39)
    at beginWork$1 (chunk-3VTW7PKX.js?v=b7030666:19818:15)
ProjectCardComponent @ ProjectCard.tsx:87
renderWithHooks @ chunk-3VTW7PKX.js?v=b7030666:11596
updateFunctionComponent @ chunk-3VTW7PKX.js?v=b7030666:14630
updateSimpleMemoComponent @ chunk-3VTW7PKX.js?v=b7030666:14511
updateMemoComponent @ chunk-3VTW7PKX.js?v=b7030666:14414
beginWork @ chunk-3VTW7PKX.js?v=b7030666:16025
callCallback2 @ chunk-3VTW7PKX.js?v=b7030666:3680
invokeGuardedCallbackDev @ chunk-3VTW7PKX.js?v=b7030666:3705
invokeGuardedCallback @ chunk-3VTW7PKX.js?v=b7030666:3739
beginWork$1 @ chunk-3VTW7PKX.js?v=b7030666:19818
performUnitOfWork @ chunk-3VTW7PKX.js?v=b7030666:19251
workLoopSync @ chunk-3VTW7PKX.js?v=b7030666:19190
renderRootSync @ chunk-3VTW7PKX.js?v=b7030666:19169
recoverFromConcurrentError @ chunk-3VTW7PKX.js?v=b7030666:18786
performConcurrentWorkOnRoot @ chunk-3VTW7PKX.js?v=b7030666:18734
workLoop @ chunk-3VTW7PKX.js?v=b7030666:197
flushWork @ chunk-3VTW7PKX.js?v=b7030666:176
performWorkUntilDeadline @ chunk-3VTW7PKX.js?v=b7030666:384
ProjectCard.tsx:87 Uncaught TypeError: Cannot read properties of undefined (reading 'filter')
    at ProjectCardComponent (ProjectCard.tsx:87:40)
    at renderWithHooks (chunk-3VTW7PKX.js?v=b7030666:11596:26)
    at updateFunctionComponent (chunk-3VTW7PKX.js?v=b7030666:14630:28)
    at updateSimpleMemoComponent (chunk-3VTW7PKX.js?v=b7030666:14511:18)
    at updateMemoComponent (chunk-3VTW7PKX.js?v=b7030666:14414:22)
    at beginWork (chunk-3VTW7PKX.js?v=b7030666:16025:22)
    at HTMLUnknownElement.callCallback2 (chunk-3VTW7PKX.js?v=b7030666:3680:22)
    at Object.invokeGuardedCallbackDev (chunk-3VTW7PKX.js?v=b7030666:3705:24)
    at invokeGuardedCallback (chunk-3VTW7PKX.js?v=b7030666:3739:39)
    at beginWork$1 (chunk-3VTW7PKX.js?v=b7030666:19818:15)
ProjectCardComponent @ ProjectCard.tsx:87
renderWithHooks @ chunk-3VTW7PKX.js?v=b7030666:11596
updateFunctionComponent @ chunk-3VTW7PKX.js?v=b7030666:14630
updateSimpleMemoComponent @ chunk-3VTW7PKX.js?v=b7030666:14511
updateMemoComponent @ chunk-3VTW7PKX.js?v=b7030666:14414
beginWork @ chunk-3VTW7PKX.js?v=b7030666:16025
callCallback2 @ chunk-3VTW7PKX.js?v=b7030666:3680
invokeGuardedCallbackDev @ chunk-3VTW7PKX.js?v=b7030666:3705
invokeGuardedCallback @ chunk-3VTW7PKX.js?v=b7030666:3739
beginWork$1 @ chunk-3VTW7PKX.js?v=b7030666:19818
performUnitOfWork @ chunk-3VTW7PKX.js?v=b7030666:19251
workLoopSync @ chunk-3VTW7PKX.js?v=b7030666:19190
renderRootSync @ chunk-3VTW7PKX.js?v=b7030666:19169
recoverFromConcurrentError @ chunk-3VTW7PKX.js?v=b7030666:18786
performConcurrentWorkOnRoot @ chunk-3VTW7PKX.js?v=b7030666:18734
workLoop @ chunk-3VTW7PKX.js?v=b7030666:197
flushWork @ chunk-3VTW7PKX.js?v=b7030666:176
performWorkUntilDeadline @ chunk-3VTW7PKX.js?v=b7030666:384
ProjectCard.tsx:87 Uncaught TypeError: Cannot read properties of undefined (reading 'filter')
    at ProjectCardComponent (ProjectCard.tsx:87:40)
    at renderWithHooks (chunk-3VTW7PKX.js?v=b7030666:11596:26)
    at updateFunctionComponent (chunk-3VTW7PKX.js?v=b7030666:14630:28)
    at updateSimpleMemoComponent (chunk-3VTW7PKX.js?v=b7030666:14511:18)
    at updateMemoComponent (chunk-3VTW7PKX.js?v=b7030666:14414:22)
    at beginWork (chunk-3VTW7PKX.js?v=b7030666:16025:22)
    at HTMLUnknownElement.callCallback2 (chunk-3VTW7PKX.js?v=b7030666:3680:22)
    at Object.invokeGuardedCallbackDev (chunk-3VTW7PKX.js?v=b7030666:3705:24)
    at invokeGuardedCallback (chunk-3VTW7PKX.js?v=b7030666:3739:39)
    at beginWork$1 (chunk-3VTW7PKX.js?v=b7030666:19818:15)
ProjectCardComponent @ ProjectCard.tsx:87
renderWithHooks @ chunk-3VTW7PKX.js?v=b7030666:11596
updateFunctionComponent @ chunk-3VTW7PKX.js?v=b7030666:14630
updateSimpleMemoComponent @ chunk-3VTW7PKX.js?v=b7030666:14511
updateMemoComponent @ chunk-3VTW7PKX.js?v=b7030666:14414
beginWork @ chunk-3VTW7PKX.js?v=b7030666:16025
callCallback2 @ chunk-3VTW7PKX.js?v=b7030666:3680
invokeGuardedCallbackDev @ chunk-3VTW7PKX.js?v=b7030666:3705
invokeGuardedCallback @ chunk-3VTW7PKX.js?v=b7030666:3739
beginWork$1 @ chunk-3VTW7PKX.js?v=b7030666:19818
performUnitOfWork @ chunk-3VTW7PKX.js?v=b7030666:19251
workLoopSync @ chunk-3VTW7PKX.js?v=b7030666:19190
renderRootSync @ chunk-3VTW7PKX.js?v=b7030666:19169
recoverFromConcurrentError @ chunk-3VTW7PKX.js?v=b7030666:18786
performConcurrentWorkOnRoot @ chunk-3VTW7PKX.js?v=b7030666:18734
workLoop @ chunk-3VTW7PKX.js?v=b7030666:197
flushWork @ chunk-3VTW7PKX.js?v=b7030666:176
performWorkUntilDeadline @ chunk-3VTW7PKX.js?v=b7030666:384
ProjectCard.tsx:87 Uncaught TypeError: Cannot read properties of undefined (reading 'filter')
    at ProjectCardComponent (ProjectCard.tsx:87:40)
    at renderWithHooks (chunk-3VTW7PKX.js?v=b7030666:11596:26)
    at updateFunctionComponent (chunk-3VTW7PKX.js?v=b7030666:14630:28)
    at updateSimpleMemoComponent (chunk-3VTW7PKX.js?v=b7030666:14511:18)
    at updateMemoComponent (chunk-3VTW7PKX.js?v=b7030666:14414:22)
    at beginWork (chunk-3VTW7PKX.js?v=b7030666:16025:22)
    at HTMLUnknownElement.callCallback2 (chunk-3VTW7PKX.js?v=b7030666:3680:22)
    at Object.invokeGuardedCallbackDev (chunk-3VTW7PKX.js?v=b7030666:3705:24)
    at invokeGuardedCallback (chunk-3VTW7PKX.js?v=b7030666:3739:39)
    at beginWork$1 (chunk-3VTW7PKX.js?v=b7030666:19818:15)
ProjectCardComponent @ ProjectCard.tsx:87
renderWithHooks @ chunk-3VTW7PKX.js?v=b7030666:11596
updateFunctionComponent @ chunk-3VTW7PKX.js?v=b7030666:14630
updateSimpleMemoComponent @ chunk-3VTW7PKX.js?v=b7030666:14511
updateMemoComponent @ chunk-3VTW7PKX.js?v=b7030666:14414
beginWork @ chunk-3VTW7PKX.js?v=b7030666:16025
callCallback2 @ chunk-3VTW7PKX.js?v=b7030666:3680
invokeGuardedCallbackDev @ chunk-3VTW7PKX.js?v=b7030666:3705
invokeGuardedCallback @ chunk-3VTW7PKX.js?v=b7030666:3739
beginWork$1 @ chunk-3VTW7PKX.js?v=b7030666:19818
performUnitOfWork @ chunk-3VTW7PKX.js?v=b7030666:19251
workLoopSync @ chunk-3VTW7PKX.js?v=b7030666:19190
renderRootSync @ chunk-3VTW7PKX.js?v=b7030666:19169
recoverFromConcurrentError @ chunk-3VTW7PKX.js?v=b7030666:18786
performConcurrentWorkOnRoot @ chunk-3VTW7PKX.js?v=b7030666:18734
workLoop @ chunk-3VTW7PKX.js?v=b7030666:197
flushWork @ chunk-3VTW7PKX.js?v=b7030666:176
performWorkUntilDeadline @ chunk-3VTW7PKX.js?v=b7030666:384
ProjectCard.tsx:87 Uncaught TypeError: Cannot read properties of undefined (reading 'filter')
    at ProjectCardComponent (ProjectCard.tsx:87:40)
    at renderWithHooks (chunk-3VTW7PKX.js?v=b7030666:11596:26)
    at updateFunctionComponent (chunk-3VTW7PKX.js?v=b7030666:14630:28)
    at updateSimpleMemoComponent (chunk-3VTW7PKX.js?v=b7030666:14511:18)
    at updateMemoComponent (chunk-3VTW7PKX.js?v=b7030666:14414:22)
    at beginWork (chunk-3VTW7PKX.js?v=b7030666:16025:22)
    at HTMLUnknownElement.callCallback2 (chunk-3VTW7PKX.js?v=b7030666:3680:22)
    at Object.invokeGuardedCallbackDev (chunk-3VTW7PKX.js?v=b7030666:3705:24)
    at invokeGuardedCallback (chunk-3VTW7PKX.js?v=b7030666:3739:39)
    at beginWork$1 (chunk-3VTW7PKX.js?v=b7030666:19818:15)
ProjectCardComponent @ ProjectCard.tsx:87
renderWithHooks @ chunk-3VTW7PKX.js?v=b7030666:11596
updateFunctionComponent @ chunk-3VTW7PKX.js?v=b7030666:14630
updateSimpleMemoComponent @ chunk-3VTW7PKX.js?v=b7030666:14511
updateMemoComponent @ chunk-3VTW7PKX.js?v=b7030666:14414
beginWork @ chunk-3VTW7PKX.js?v=b7030666:16025
callCallback2 @ chunk-3VTW7PKX.js?v=b7030666:3680
invokeGuardedCallbackDev @ chunk-3VTW7PKX.js?v=b7030666:3705
invokeGuardedCallback @ chunk-3VTW7PKX.js?v=b7030666:3739
beginWork$1 @ chunk-3VTW7PKX.js?v=b7030666:19818
performUnitOfWork @ chunk-3VTW7PKX.js?v=b7030666:19251
workLoopSync @ chunk-3VTW7PKX.js?v=b7030666:19190
renderRootSync @ chunk-3VTW7PKX.js?v=b7030666:19169
recoverFromConcurrentError @ chunk-3VTW7PKX.js?v=b7030666:18786
performConcurrentWorkOnRoot @ chunk-3VTW7PKX.js?v=b7030666:18734
workLoop @ chunk-3VTW7PKX.js?v=b7030666:197
flushWork @ chunk-3VTW7PKX.js?v=b7030666:176
performWorkUntilDeadline @ chunk-3VTW7PKX.js?v=b7030666:384
ProjectCard.tsx:87 Uncaught TypeError: Cannot read properties of undefined (reading 'filter')
    at ProjectCardComponent (ProjectCard.tsx:87:40)
    at renderWithHooks (chunk-3VTW7PKX.js?v=b7030666:11596:26)
    at updateFunctionComponent (chunk-3VTW7PKX.js?v=b7030666:14630:28)
    at updateSimpleMemoComponent (chunk-3VTW7PKX.js?v=b7030666:14511:18)
    at updateMemoComponent (chunk-3VTW7PKX.js?v=b7030666:14414:22)
    at beginWork (chunk-3VTW7PKX.js?v=b7030666:16025:22)
    at HTMLUnknownElement.callCallback2 (chunk-3VTW7PKX.js?v=b7030666:3680:22)
    at Object.invokeGuardedCallbackDev (chunk-3VTW7PKX.js?v=b7030666:3705:24)
    at invokeGuardedCallback (chunk-3VTW7PKX.js?v=b7030666:3739:39)
    at beginWork$1 (chunk-3VTW7PKX.js?v=b7030666:19818:15)
ProjectCardComponent @ ProjectCard.tsx:87
renderWithHooks @ chunk-3VTW7PKX.js?v=b7030666:11596
updateFunctionComponent @ chunk-3VTW7PKX.js?v=b7030666:14630
updateSimpleMemoComponent @ chunk-3VTW7PKX.js?v=b7030666:14511
updateMemoComponent @ chunk-3VTW7PKX.js?v=b7030666:14414
beginWork @ chunk-3VTW7PKX.js?v=b7030666:16025
callCallback2 @ chunk-3VTW7PKX.js?v=b7030666:3680
invokeGuardedCallbackDev @ chunk-3VTW7PKX.js?v=b7030666:3705
invokeGuardedCallback @ chunk-3VTW7PKX.js?v=b7030666:3739
beginWork$1 @ chunk-3VTW7PKX.js?v=b7030666:19818
performUnitOfWork @ chunk-3VTW7PKX.js?v=b7030666:19251
workLoopSync @ chunk-3VTW7PKX.js?v=b7030666:19190
renderRootSync @ chunk-3VTW7PKX.js?v=b7030666:19169
recoverFromConcurrentError @ chunk-3VTW7PKX.js?v=b7030666:18786
performConcurrentWorkOnRoot @ chunk-3VTW7PKX.js?v=b7030666:18734
workLoop @ chunk-3VTW7PKX.js?v=b7030666:197
flushWork @ chunk-3VTW7PKX.js?v=b7030666:176
performWorkUntilDeadline @ chunk-3VTW7PKX.js?v=b7030666:384
ProjectCard.tsx:87 Uncaught TypeError: Cannot read properties of undefined (reading 'filter')
    at ProjectCardComponent (ProjectCard.tsx:87:40)
    at renderWithHooks (chunk-3VTW7PKX.js?v=b7030666:11596:26)
    at updateFunctionComponent (chunk-3VTW7PKX.js?v=b7030666:14630:28)
    at updateSimpleMemoComponent (chunk-3VTW7PKX.js?v=b7030666:14511:18)
    at updateMemoComponent (chunk-3VTW7PKX.js?v=b7030666:14414:22)
    at beginWork (chunk-3VTW7PKX.js?v=b7030666:16025:22)
    at HTMLUnknownElement.callCallback2 (chunk-3VTW7PKX.js?v=b7030666:3680:22)
    at Object.invokeGuardedCallbackDev (chunk-3VTW7PKX.js?v=b7030666:3705:24)
    at invokeGuardedCallback (chunk-3VTW7PKX.js?v=b7030666:3739:39)
    at beginWork$1 (chunk-3VTW7PKX.js?v=b7030666:19818:15)
ProjectCardComponent @ ProjectCard.tsx:87
renderWithHooks @ chunk-3VTW7PKX.js?v=b7030666:11596
updateFunctionComponent @ chunk-3VTW7PKX.js?v=b7030666:14630
updateSimpleMemoComponent @ chunk-3VTW7PKX.js?v=b7030666:14511
updateMemoComponent @ chunk-3VTW7PKX.js?v=b7030666:14414
beginWork @ chunk-3VTW7PKX.js?v=b7030666:16025
callCallback2 @ chunk-3VTW7PKX.js?v=b7030666:3680
invokeGuardedCallbackDev @ chunk-3VTW7PKX.js?v=b7030666:3705
invokeGuardedCallback @ chunk-3VTW7PKX.js?v=b7030666:3739
beginWork$1 @ chunk-3VTW7PKX.js?v=b7030666:19818
performUnitOfWork @ chunk-3VTW7PKX.js?v=b7030666:19251
workLoopSync @ chunk-3VTW7PKX.js?v=b7030666:19190
renderRootSync @ chunk-3VTW7PKX.js?v=b7030666:19169
recoverFromConcurrentError @ chunk-3VTW7PKX.js?v=b7030666:18786
performConcurrentWorkOnRoot @ chunk-3VTW7PKX.js?v=b7030666:18734
workLoop @ chunk-3VTW7PKX.js?v=b7030666:197
flushWork @ chunk-3VTW7PKX.js?v=b7030666:176
performWorkUntilDeadline @ chunk-3VTW7PKX.js?v=b7030666:384
ProjectCard.tsx:87 Uncaught TypeError: Cannot read properties of undefined (reading 'filter')
    at ProjectCardComponent (ProjectCard.tsx:87:40)
    at renderWithHooks (chunk-3VTW7PKX.js?v=b7030666:11596:26)
    at updateFunctionComponent (chunk-3VTW7PKX.js?v=b7030666:14630:28)
    at updateSimpleMemoComponent (chunk-3VTW7PKX.js?v=b7030666:14511:18)
    at updateMemoComponent (chunk-3VTW7PKX.js?v=b7030666:14414:22)
    at beginWork (chunk-3VTW7PKX.js?v=b7030666:16025:22)
    at HTMLUnknownElement.callCallback2 (chunk-3VTW7PKX.js?v=b7030666:3680:22)
    at Object.invokeGuardedCallbackDev (chunk-3VTW7PKX.js?v=b7030666:3705:24)
    at invokeGuardedCallback (chunk-3VTW7PKX.js?v=b7030666:3739:39)
    at beginWork$1 (chunk-3VTW7PKX.js?v=b7030666:19818:15)
ProjectCardComponent @ ProjectCard.tsx:87
renderWithHooks @ chunk-3VTW7PKX.js?v=b7030666:11596
updateFunctionComponent @ chunk-3VTW7PKX.js?v=b7030666:14630
updateSimpleMemoComponent @ chunk-3VTW7PKX.js?v=b7030666:14511
updateMemoComponent @ chunk-3VTW7PKX.js?v=b7030666:14414
beginWork @ chunk-3VTW7PKX.js?v=b7030666:16025
callCallback2 @ chunk-3VTW7PKX.js?v=b7030666:3680
invokeGuardedCallbackDev @ chunk-3VTW7PKX.js?v=b7030666:3705
invokeGuardedCallback @ chunk-3VTW7PKX.js?v=b7030666:3739
beginWork$1 @ chunk-3VTW7PKX.js?v=b7030666:19818
performUnitOfWork @ chunk-3VTW7PKX.js?v=b7030666:19251
workLoopSync @ chunk-3VTW7PKX.js?v=b7030666:19190
renderRootSync @ chunk-3VTW7PKX.js?v=b7030666:19169
recoverFromConcurrentError @ chunk-3VTW7PKX.js?v=b7030666:18786
performConcurrentWorkOnRoot @ chunk-3VTW7PKX.js?v=b7030666:18734
workLoop @ chunk-3VTW7PKX.js?v=b7030666:197
flushWork @ chunk-3VTW7PKX.js?v=b7030666:176
performWorkUntilDeadline @ chunk-3VTW7PKX.js?v=b7030666:384
ProjectCard.tsx:87 Uncaught TypeError: Cannot read properties of undefined (reading 'filter')
    at ProjectCardComponent (ProjectCard.tsx:87:40)
    at renderWithHooks (chunk-3VTW7PKX.js?v=b7030666:11596:26)
    at updateFunctionComponent (chunk-3VTW7PKX.js?v=b7030666:14630:28)
    at updateSimpleMemoComponent (chunk-3VTW7PKX.js?v=b7030666:14511:18)
    at updateMemoComponent (chunk-3VTW7PKX.js?v=b7030666:14414:22)
    at beginWork (chunk-3VTW7PKX.js?v=b7030666:16025:22)
    at HTMLUnknownElement.callCallback2 (chunk-3VTW7PKX.js?v=b7030666:3680:22)
    at Object.invokeGuardedCallbackDev (chunk-3VTW7PKX.js?v=b7030666:3705:24)
    at invokeGuardedCallback (chunk-3VTW7PKX.js?v=b7030666:3739:39)
    at beginWork$1 (chunk-3VTW7PKX.js?v=b7030666:19818:15)
ProjectCardComponent @ ProjectCard.tsx:87
renderWithHooks @ chunk-3VTW7PKX.js?v=b7030666:11596
updateFunctionComponent @ chunk-3VTW7PKX.js?v=b7030666:14630
updateSimpleMemoComponent @ chunk-3VTW7PKX.js?v=b7030666:14511
updateMemoComponent @ chunk-3VTW7PKX.js?v=b7030666:14414
beginWork @ chunk-3VTW7PKX.js?v=b7030666:16025
callCallback2 @ chunk-3VTW7PKX.js?v=b7030666:3680
invokeGuardedCallbackDev @ chunk-3VTW7PKX.js?v=b7030666:3705
invokeGuardedCallback @ chunk-3VTW7PKX.js?v=b7030666:3739
beginWork$1 @ chunk-3VTW7PKX.js?v=b7030666:19818
performUnitOfWork @ chunk-3VTW7PKX.js?v=b7030666:19251
workLoopSync @ chunk-3VTW7PKX.js?v=b7030666:19190
renderRootSync @ chunk-3VTW7PKX.js?v=b7030666:19169
recoverFromConcurrentError @ chunk-3VTW7PKX.js?v=b7030666:18786
performConcurrentWorkOnRoot @ chunk-3VTW7PKX.js?v=b7030666:18734
workLoop @ chunk-3VTW7PKX.js?v=b7030666:197
flushWork @ chunk-3VTW7PKX.js?v=b7030666:176
performWorkUntilDeadline @ chunk-3VTW7PKX.js?v=b7030666:384
ProjectCard.tsx:87 Uncaught TypeError: Cannot read properties of undefined (reading 'filter')
    at ProjectCardComponent (ProjectCard.tsx:87:40)
    at renderWithHooks (chunk-3VTW7PKX.js?v=b7030666:11596:26)
    at updateFunctionComponent (chunk-3VTW7PKX.js?v=b7030666:14630:28)
    at updateSimpleMemoComponent (chunk-3VTW7PKX.js?v=b7030666:14511:18)
    at updateMemoComponent (chunk-3VTW7PKX.js?v=b7030666:14414:22)
    at beginWork (chunk-3VTW7PKX.js?v=b7030666:16025:22)
    at HTMLUnknownElement.callCallback2 (chunk-3VTW7PKX.js?v=b7030666:3680:22)
    at Object.invokeGuardedCallbackDev (chunk-3VTW7PKX.js?v=b7030666:3705:24)
    at invokeGuardedCallback (chunk-3VTW7PKX.js?v=b7030666:3739:39)
    at beginWork$1 (chunk-3VTW7PKX.js?v=b7030666:19818:15)
ProjectCardComponent @ ProjectCard.tsx:87
renderWithHooks @ chunk-3VTW7PKX.js?v=b7030666:11596
updateFunctionComponent @ chunk-3VTW7PKX.js?v=b7030666:14630
updateSimpleMemoComponent @ chunk-3VTW7PKX.js?v=b7030666:14511
updateMemoComponent @ chunk-3VTW7PKX.js?v=b7030666:14414
beginWork @ chunk-3VTW7PKX.js?v=b7030666:16025
callCallback2 @ chunk-3VTW7PKX.js?v=b7030666:3680
invokeGuardedCallbackDev @ chunk-3VTW7PKX.js?v=b7030666:3705
invokeGuardedCallback @ chunk-3VTW7PKX.js?v=b7030666:3739
beginWork$1 @ chunk-3VTW7PKX.js?v=b7030666:19818
performUnitOfWork @ chunk-3VTW7PKX.js?v=b7030666:19251
workLoopSync @ chunk-3VTW7PKX.js?v=b7030666:19190
renderRootSync @ chunk-3VTW7PKX.js?v=b7030666:19169
recoverFromConcurrentError @ chunk-3VTW7PKX.js?v=b7030666:18786
performConcurrentWorkOnRoot @ chunk-3VTW7PKX.js?v=b7030666:18734
workLoop @ chunk-3VTW7PKX.js?v=b7030666:197
flushWork @ chunk-3VTW7PKX.js?v=b7030666:176
performWorkUntilDeadline @ chunk-3VTW7PKX.js?v=b7030666:384
ProjectCard.tsx:87 Uncaught TypeError: Cannot read properties of undefined (reading 'filter')
    at ProjectCardComponent (ProjectCard.tsx:87:40)
    at renderWithHooks (chunk-3VTW7PKX.js?v=b7030666:11596:26)
    at updateFunctionComponent (chunk-3VTW7PKX.js?v=b7030666:14630:28)
    at updateSimpleMemoComponent (chunk-3VTW7PKX.js?v=b7030666:14511:18)
    at updateMemoComponent (chunk-3VTW7PKX.js?v=b7030666:14414:22)
    at beginWork (chunk-3VTW7PKX.js?v=b7030666:16025:22)
    at HTMLUnknownElement.callCallback2 (chunk-3VTW7PKX.js?v=b7030666:3680:22)
    at Object.invokeGuardedCallbackDev (chunk-3VTW7PKX.js?v=b7030666:3705:24)
    at invokeGuardedCallback (chunk-3VTW7PKX.js?v=b7030666:3739:39)
    at beginWork$1 (chunk-3VTW7PKX.js?v=b7030666:19818:15)
ProjectCardComponent @ ProjectCard.tsx:87
renderWithHooks @ chunk-3VTW7PKX.js?v=b7030666:11596
updateFunctionComponent @ chunk-3VTW7PKX.js?v=b7030666:14630
updateSimpleMemoComponent @ chunk-3VTW7PKX.js?v=b7030666:14511
updateMemoComponent @ chunk-3VTW7PKX.js?v=b7030666:14414
beginWork @ chunk-3VTW7PKX.js?v=b7030666:16025
callCallback2 @ chunk-3VTW7PKX.js?v=b7030666:3680
invokeGuardedCallbackDev @ chunk-3VTW7PKX.js?v=b7030666:3705
invokeGuardedCallback @ chunk-3VTW7PKX.js?v=b7030666:3739
beginWork$1 @ chunk-3VTW7PKX.js?v=b7030666:19818
performUnitOfWork @ chunk-3VTW7PKX.js?v=b7030666:19251
workLoopSync @ chunk-3VTW7PKX.js?v=b7030666:19190
renderRootSync @ chunk-3VTW7PKX.js?v=b7030666:19169
recoverFromConcurrentError @ chunk-3VTW7PKX.js?v=b7030666:18786
performConcurrentWorkOnRoot @ chunk-3VTW7PKX.js?v=b7030666:18734
workLoop @ chunk-3VTW7PKX.js?v=b7030666:197
flushWork @ chunk-3VTW7PKX.js?v=b7030666:176
performWorkUntilDeadline @ chunk-3VTW7PKX.js?v=b7030666:384
ProjectCard.tsx:87 Uncaught TypeError: Cannot read properties of undefined (reading 'filter')
    at ProjectCardComponent (ProjectCard.tsx:87:40)
    at renderWithHooks (chunk-3VTW7PKX.js?v=b7030666:11596:26)
    at updateFunctionComponent (chunk-3VTW7PKX.js?v=b7030666:14630:28)
    at updateSimpleMemoComponent (chunk-3VTW7PKX.js?v=b7030666:14511:18)
    at updateMemoComponent (chunk-3VTW7PKX.js?v=b7030666:14414:22)
    at beginWork (chunk-3VTW7PKX.js?v=b7030666:16025:22)
    at HTMLUnknownElement.callCallback2 (chunk-3VTW7PKX.js?v=b7030666:3680:22)
    at Object.invokeGuardedCallbackDev (chunk-3VTW7PKX.js?v=b7030666:3705:24)
    at invokeGuardedCallback (chunk-3VTW7PKX.js?v=b7030666:3739:39)
    at beginWork$1 (chunk-3VTW7PKX.js?v=b7030666:19818:15)
ProjectCardComponent @ ProjectCard.tsx:87
renderWithHooks @ chunk-3VTW7PKX.js?v=b7030666:11596
updateFunctionComponent @ chunk-3VTW7PKX.js?v=b7030666:14630
updateSimpleMemoComponent @ chunk-3VTW7PKX.js?v=b7030666:14511
updateMemoComponent @ chunk-3VTW7PKX.js?v=b7030666:14414
beginWork @ chunk-3VTW7PKX.js?v=b7030666:16025
callCallback2 @ chunk-3VTW7PKX.js?v=b7030666:3680
invokeGuardedCallbackDev @ chunk-3VTW7PKX.js?v=b7030666:3705
invokeGuardedCallback @ chunk-3VTW7PKX.js?v=b7030666:3739
beginWork$1 @ chunk-3VTW7PKX.js?v=b7030666:19818
performUnitOfWork @ chunk-3VTW7PKX.js?v=b7030666:19251
workLoopSync @ chunk-3VTW7PKX.js?v=b7030666:19190
renderRootSync @ chunk-3VTW7PKX.js?v=b7030666:19169
recoverFromConcurrentError @ chunk-3VTW7PKX.js?v=b7030666:18786
performConcurrentWorkOnRoot @ chunk-3VTW7PKX.js?v=b7030666:18734
workLoop @ chunk-3VTW7PKX.js?v=b7030666:197
flushWork @ chunk-3VTW7PKX.js?v=b7030666:176
performWorkUntilDeadline @ chunk-3VTW7PKX.js?v=b7030666:384
ProjectCard.tsx:87 Uncaught TypeError: Cannot read properties of undefined (reading 'filter')
    at ProjectCardComponent (ProjectCard.tsx:87:40)
    at renderWithHooks (chunk-3VTW7PKX.js?v=b7030666:11596:26)
    at updateFunctionComponent (chunk-3VTW7PKX.js?v=b7030666:14630:28)
    at updateSimpleMemoComponent (chunk-3VTW7PKX.js?v=b7030666:14511:18)
    at updateMemoComponent (chunk-3VTW7PKX.js?v=b7030666:14414:22)
    at beginWork (chunk-3VTW7PKX.js?v=b7030666:16025:22)
    at HTMLUnknownElement.callCallback2 (chunk-3VTW7PKX.js?v=b7030666:3680:22)
    at Object.invokeGuardedCallbackDev (chunk-3VTW7PKX.js?v=b7030666:3705:24)
    at invokeGuardedCallback (chunk-3VTW7PKX.js?v=b7030666:3739:39)
    at beginWork$1 (chunk-3VTW7PKX.js?v=b7030666:19818:15)
ProjectCardComponent @ ProjectCard.tsx:87
renderWithHooks @ chunk-3VTW7PKX.js?v=b7030666:11596
updateFunctionComponent @ chunk-3VTW7PKX.js?v=b7030666:14630
updateSimpleMemoComponent @ chunk-3VTW7PKX.js?v=b7030666:14511
updateMemoComponent @ chunk-3VTW7PKX.js?v=b7030666:14414
beginWork @ chunk-3VTW7PKX.js?v=b7030666:16025
callCallback2 @ chunk-3VTW7PKX.js?v=b7030666:3680
invokeGuardedCallbackDev @ chunk-3VTW7PKX.js?v=b7030666:3705
invokeGuardedCallback @ chunk-3VTW7PKX.js?v=b7030666:3739
beginWork$1 @ chunk-3VTW7PKX.js?v=b7030666:19818
performUnitOfWork @ chunk-3VTW7PKX.js?v=b7030666:19251
workLoopSync @ chunk-3VTW7PKX.js?v=b7030666:19190
renderRootSync @ chunk-3VTW7PKX.js?v=b7030666:19169
recoverFromConcurrentError @ chunk-3VTW7PKX.js?v=b7030666:18786
performConcurrentWorkOnRoot @ chunk-3VTW7PKX.js?v=b7030666:18734
workLoop @ chunk-3VTW7PKX.js?v=b7030666:197
flushWork @ chunk-3VTW7PKX.js?v=b7030666:176
performWorkUntilDeadline @ chunk-3VTW7PKX.js?v=b7030666:384
ProjectCard.tsx:87 Uncaught TypeError: Cannot read properties of undefined (reading 'filter')
    at ProjectCardComponent (ProjectCard.tsx:87:40)
    at renderWithHooks (chunk-3VTW7PKX.js?v=b7030666:11596:26)
    at updateFunctionComponent (chunk-3VTW7PKX.js?v=b7030666:14630:28)
    at updateSimpleMemoComponent (chunk-3VTW7PKX.js?v=b7030666:14511:18)
    at updateMemoComponent (chunk-3VTW7PKX.js?v=b7030666:14414:22)
    at beginWork (chunk-3VTW7PKX.js?v=b7030666:16025:22)
    at HTMLUnknownElement.callCallback2 (chunk-3VTW7PKX.js?v=b7030666:3680:22)
    at Object.invokeGuardedCallbackDev (chunk-3VTW7PKX.js?v=b7030666:3705:24)
    at invokeGuardedCallback (chunk-3VTW7PKX.js?v=b7030666:3739:39)
    at beginWork$1 (chunk-3VTW7PKX.js?v=b7030666:19818:15)
ProjectCardComponent @ ProjectCard.tsx:87
renderWithHooks @ chunk-3VTW7PKX.js?v=b7030666:11596
updateFunctionComponent @ chunk-3VTW7PKX.js?v=b7030666:14630
updateSimpleMemoComponent @ chunk-3VTW7PKX.js?v=b7030666:14511
updateMemoComponent @ chunk-3VTW7PKX.js?v=b7030666:14414
beginWork @ chunk-3VTW7PKX.js?v=b7030666:16025
callCallback2 @ chunk-3VTW7PKX.js?v=b7030666:3680
invokeGuardedCallbackDev @ chunk-3VTW7PKX.js?v=b7030666:3705
invokeGuardedCallback @ chunk-3VTW7PKX.js?v=b7030666:3739
beginWork$1 @ chunk-3VTW7PKX.js?v=b7030666:19818
performUnitOfWork @ chunk-3VTW7PKX.js?v=b7030666:19251
workLoopSync @ chunk-3VTW7PKX.js?v=b7030666:19190
renderRootSync @ chunk-3VTW7PKX.js?v=b7030666:19169
recoverFromConcurrentError @ chunk-3VTW7PKX.js?v=b7030666:18786
performConcurrentWorkOnRoot @ chunk-3VTW7PKX.js?v=b7030666:18734
workLoop @ chunk-3VTW7PKX.js?v=b7030666:197
flushWork @ chunk-3VTW7PKX.js?v=b7030666:176
performWorkUntilDeadline @ chunk-3VTW7PKX.js?v=b7030666:384
chunk-3VTW7PKX.js?v=b7030666:14080 The above error occurred in the <ProjectCardComponent> component:

    at ProjectCardComponent (http://localhost:8080/src/components/ProjectCard.tsx:88:33)
    at div
    at div
    at Projects (http://localhost:8080/src/pages/Projects.tsx?t=1758549290295:45:73)
    at Suspense
    at ErrorBoundary (http://localhost:8080/src/components/ErrorBoundary/ErrorBoundary.tsx:272:5)
    at PageErrorBoundary (http://localhost:8080/src/components/ErrorBoundary/ErrorBoundary.tsx:288:37)
    at LazyRoute (http://localhost:8080/src/App.tsx?t=1758549303961:82:22)
    at ProtectedRoute (http://localhost:8080/src/components/auth/ProtectedRoute.tsx?t=1758546487915:30:38)
    at RequireAuth (http://localhost:8080/src/components/auth/ProtectedRoute.tsx?t=1758546487915:179:35)
    at RenderedRoute (http://localhost:8080/node_modules/.vite/deps/react-router-dom.js?v=b7030666:4089:5)
    at Outlet (http://localhost:8080/node_modules/.vite/deps/react-router-dom.js?v=b7030666:4495:26)
    at div
    at main
    at div
    at Layout (http://localhost:8080/src/components/Layout.tsx?t=1758549303961:37:22)
    at RenderedRoute (http://localhost:8080/node_modules/.vite/deps/react-router-dom.js?v=b7030666:4089:5)
    at Routes (http://localhost:8080/node_modules/.vite/deps/react-router-dom.js?v=b7030666:4559:5)
    at ClientProvider (http://localhost:8080/src/context/ClientContext.tsx?t=1758546487915:27:34)
    at TaskProvider (http://localhost:8080/src/context/TaskContext.tsx?t=1758549272061:36:32)
    at ProjectProvider (http://localhost:8080/src/context/ProjectContext.tsx?t=1758549290295:41:35)
    at SessionContextProvider (http://localhost:8080/src/context/SessionContext.tsx?t=1758546487915:31:42)
    at Provider (http://localhost:8080/node_modules/.vite/deps/chunk-PSSEWZHR.js?v=b7030666:38:15)
    at TooltipProvider (http://localhost:8080/node_modules/.vite/deps/@radix-ui_react-tooltip.js?v=b7030666:65:5)
    at QueryClientProvider (http://localhost:8080/node_modules/.vite/deps/@tanstack_react-query.js?v=b7030666:2875:3)
    at ErrorBoundary (http://localhost:8080/src/components/ErrorBoundary/ErrorBoundary.tsx:272:5)
    at App
    at Router (http://localhost:8080/node_modules/.vite/deps/react-router-dom.js?v=b7030666:4502:15)
    at BrowserRouter (http://localhost:8080/node_modules/.vite/deps/react-router-dom.js?v=b7030666:5248:5)

React will try to recreate this component tree from scratch using the error boundary you provided, ErrorBoundary.
logCapturedError @ chunk-3VTW7PKX.js?v=b7030666:14080
callback @ chunk-3VTW7PKX.js?v=b7030666:14126
callCallback @ chunk-3VTW7PKX.js?v=b7030666:11296
commitUpdateQueue @ chunk-3VTW7PKX.js?v=b7030666:11313
commitLayoutEffectOnFiber @ chunk-3VTW7PKX.js?v=b7030666:17123
commitLayoutMountEffects_complete @ chunk-3VTW7PKX.js?v=b7030666:18030
commitLayoutEffects_begin @ chunk-3VTW7PKX.js?v=b7030666:18019
commitLayoutEffects @ chunk-3VTW7PKX.js?v=b7030666:17970
commitRootImpl @ chunk-3VTW7PKX.js?v=b7030666:19406
commitRoot @ chunk-3VTW7PKX.js?v=b7030666:19330
finishConcurrentRender @ chunk-3VTW7PKX.js?v=b7030666:18813
performConcurrentWorkOnRoot @ chunk-3VTW7PKX.js?v=b7030666:18768
workLoop @ chunk-3VTW7PKX.js?v=b7030666:197
flushWork @ chunk-3VTW7PKX.js?v=b7030666:176
performWorkUntilDeadline @ chunk-3VTW7PKX.js?v=b7030666:384
ErrorBoundary.tsx:29 Error caught by boundary: TypeError: Cannot read properties of undefined (reading 'filter')
    at ProjectCardComponent (ProjectCard.tsx:87:40)
    at renderWithHooks (chunk-3VTW7PKX.js?v=b7030666:11596:26)
    at updateFunctionComponent (chunk-3VTW7PKX.js?v=b7030666:14630:28)
    at updateSimpleMemoComponent (chunk-3VTW7PKX.js?v=b7030666:14511:18)
    at updateMemoComponent (chunk-3VTW7PKX.js?v=b7030666:14414:22)
    at beginWork (chunk-3VTW7PKX.js?v=b7030666:16025:22)
    at beginWork$1 (chunk-3VTW7PKX.js?v=b7030666:19806:22)
    at performUnitOfWork (chunk-3VTW7PKX.js?v=b7030666:19251:20)
    at workLoopSync (chunk-3VTW7PKX.js?v=b7030666:19190:13)
    at renderRootSync (chunk-3VTW7PKX.js?v=b7030666:19169:15) {componentStack: '\n    at ProjectCardComponent (http://localhost:808….vite/deps/react-router-dom.js?v=b7030666:5248:5)'}
componentDidCatch @ ErrorBoundary.tsx:29
callback @ chunk-3VTW7PKX.js?v=b7030666:14132
callCallback @ chunk-3VTW7PKX.js?v=b7030666:11296
commitUpdateQueue @ chunk-3VTW7PKX.js?v=b7030666:11313
commitLayoutEffectOnFiber @ chunk-3VTW7PKX.js?v=b7030666:17123
commitLayoutMountEffects_complete @ chunk-3VTW7PKX.js?v=b7030666:18030
commitLayoutEffects_begin @ chunk-3VTW7PKX.js?v=b7030666:18019
commitLayoutEffects @ chunk-3VTW7PKX.js?v=b7030666:17970
commitRootImpl @ chunk-3VTW7PKX.js?v=b7030666:19406
commitRoot @ chunk-3VTW7PKX.js?v=b7030666:19330
finishConcurrentRender @ chunk-3VTW7PKX.js?v=b7030666:18813
performConcurrentWorkOnRoot @ chunk-3VTW7PKX.js?v=b7030666:18768
workLoop @ chunk-3VTW7PKX.js?v=b7030666:197
flushWork @ chunk-3VTW7PKX.js?v=b7030666:176
performWorkUntilDeadline @ chunk-3VTW7PKX.js?v=b7030666:384
chunk-3VTW7PKX.js?v=b7030666:14080 The above error occurred in the <ProjectCardComponent> component:

    at ProjectCardComponent (http://localhost:8080/src/components/ProjectCard.tsx:88:33)
    at div
    at div
    at Projects (http://localhost:8080/src/pages/Projects.tsx?t=1758549290295:45:73)
    at Suspense
    at ErrorBoundary (http://localhost:8080/src/components/ErrorBoundary/ErrorBoundary.tsx:272:5)
    at PageErrorBoundary (http://localhost:8080/src/components/ErrorBoundary/ErrorBoundary.tsx:288:37)
    at LazyRoute (http://localhost:8080/src/App.tsx?t=1758549303961:82:22)
    at ProtectedRoute (http://localhost:8080/src/components/auth/ProtectedRoute.tsx?t=1758546487915:30:38)
    at RequireAuth (http://localhost:8080/src/components/auth/ProtectedRoute.tsx?t=1758546487915:179:35)
    at RenderedRoute (http://localhost:8080/node_modules/.vite/deps/react-router-dom.js?v=b7030666:4089:5)
    at Outlet (http://localhost:8080/node_modules/.vite/deps/react-router-dom.js?v=b7030666:4495:26)
    at div
    at main
    at div
    at Layout (http://localhost:8080/src/components/Layout.tsx?t=1758549303961:37:22)
    at RenderedRoute (http://localhost:8080/node_modules/.vite/deps/react-router-dom.js?v=b7030666:4089:5)
    at Routes (http://localhost:8080/node_modules/.vite/deps/react-router-dom.js?v=b7030666:4559:5)
    at ClientProvider (http://localhost:8080/src/context/ClientContext.tsx?t=1758546487915:27:34)
    at TaskProvider (http://localhost:8080/src/context/TaskContext.tsx?t=1758549272061:36:32)
    at ProjectProvider (http://localhost:8080/src/context/ProjectContext.tsx?t=1758549290295:41:35)
    at SessionContextProvider (http://localhost:8080/src/context/SessionContext.tsx?t=1758546487915:31:42)
    at Provider (http://localhost:8080/node_modules/.vite/deps/chunk-PSSEWZHR.js?v=b7030666:38:15)
    at TooltipProvider (http://localhost:8080/node_modules/.vite/deps/@radix-ui_react-tooltip.js?v=b7030666:65:5)
    at QueryClientProvider (http://localhost:8080/node_modules/.vite/deps/@tanstack_react-query.js?v=b7030666:2875:3)
    at ErrorBoundary (http://localhost:8080/src/components/ErrorBoundary/ErrorBoundary.tsx:272:5)
    at App
    at Router (http://localhost:8080/node_modules/.vite/deps/react-router-dom.js?v=b7030666:4502:15)
    at BrowserRouter (http://localhost:8080/node_modules/.vite/deps/react-router-dom.js?v=b7030666:5248:5)

React will try to recreate this component tree from scratch using the error boundary you provided, ErrorBoundary.
logCapturedError @ chunk-3VTW7PKX.js?v=b7030666:14080
callback @ chunk-3VTW7PKX.js?v=b7030666:14126
callCallback @ chunk-3VTW7PKX.js?v=b7030666:11296
commitUpdateQueue @ chunk-3VTW7PKX.js?v=b7030666:11313
commitLayoutEffectOnFiber @ chunk-3VTW7PKX.js?v=b7030666:17123
commitLayoutMountEffects_complete @ chunk-3VTW7PKX.js?v=b7030666:18030
commitLayoutEffects_begin @ chunk-3VTW7PKX.js?v=b7030666:18019
commitLayoutEffects @ chunk-3VTW7PKX.js?v=b7030666:17970
commitRootImpl @ chunk-3VTW7PKX.js?v=b7030666:19406
commitRoot @ chunk-3VTW7PKX.js?v=b7030666:19330
finishConcurrentRender @ chunk-3VTW7PKX.js?v=b7030666:18813
performConcurrentWorkOnRoot @ chunk-3VTW7PKX.js?v=b7030666:18768
workLoop @ chunk-3VTW7PKX.js?v=b7030666:197
flushWork @ chunk-3VTW7PKX.js?v=b7030666:176
performWorkUntilDeadline @ chunk-3VTW7PKX.js?v=b7030666:384
ErrorBoundary.tsx:29 Error caught by boundary: TypeError: Cannot read properties of undefined (reading 'filter')
    at ProjectCardComponent (ProjectCard.tsx:87:40)
    at renderWithHooks (chunk-3VTW7PKX.js?v=b7030666:11596:26)
    at updateFunctionComponent (chunk-3VTW7PKX.js?v=b7030666:14630:28)
    at updateSimpleMemoComponent (chunk-3VTW7PKX.js?v=b7030666:14511:18)
    at updateMemoComponent (chunk-3VTW7PKX.js?v=b7030666:14414:22)
    at beginWork (chunk-3VTW7PKX.js?v=b7030666:16025:22)
    at beginWork$1 (chunk-3VTW7PKX.js?v=b7030666:19806:22)
    at performUnitOfWork (chunk-3VTW7PKX.js?v=b7030666:19251:20)
    at workLoopSync (chunk-3VTW7PKX.js?v=b7030666:19190:13)
    at renderRootSync (chunk-3VTW7PKX.js?v=b7030666:19169:15) {componentStack: '\n    at ProjectCardComponent (http://localhost:808….vite/deps/react-router-dom.js?v=b7030666:5248:5)'}
componentDidCatch @ ErrorBoundary.tsx:29
callback @ chunk-3VTW7PKX.js?v=b7030666:14132
callCallback @ chunk-3VTW7PKX.js?v=b7030666:11296
commitUpdateQueue @ chunk-3VTW7PKX.js?v=b7030666:11313
commitLayoutEffectOnFiber @ chunk-3VTW7PKX.js?v=b7030666:17123
commitLayoutMountEffects_complete @ chunk-3VTW7PKX.js?v=b7030666:18030
commitLayoutEffects_begin @ chunk-3VTW7PKX.js?v=b7030666:18019
commitLayoutEffects @ chunk-3VTW7PKX.js?v=b7030666:17970
commitRootImpl @ chunk-3VTW7PKX.js?v=b7030666:19406
commitRoot @ chunk-3VTW7PKX.js?v=b7030666:19330
finishConcurrentRender @ chunk-3VTW7PKX.js?v=b7030666:18813
performConcurrentWorkOnRoot @ chunk-3VTW7PKX.js?v=b7030666:18768
workLoop @ chunk-3VTW7PKX.js?v=b7030666:197
flushWork @ chunk-3VTW7PKX.js?v=b7030666:176
performWorkUntilDeadline @ chunk-3VTW7PKX.js?v=b7030666:384
chunk-3VTW7PKX.js?v=b7030666:14080 The above error occurred in the <ProjectCardComponent> component:

    at ProjectCardComponent (http://localhost:8080/src/components/ProjectCard.tsx:88:33)
    at div
    at div
    at Projects (http://localhost:8080/src/pages/Projects.tsx?t=1758549290295:45:73)
    at Suspense
    at ErrorBoundary (http://localhost:8080/src/components/ErrorBoundary/ErrorBoundary.tsx:272:5)
    at PageErrorBoundary (http://localhost:8080/src/components/ErrorBoundary/ErrorBoundary.tsx:288:37)
    at LazyRoute (http://localhost:8080/src/App.tsx?t=1758549303961:82:22)
    at ProtectedRoute (http://localhost:8080/src/components/auth/ProtectedRoute.tsx?t=1758546487915:30:38)
    at RequireAuth (http://localhost:8080/src/components/auth/ProtectedRoute.tsx?t=1758546487915:179:35)
    at RenderedRoute (http://localhost:8080/node_modules/.vite/deps/react-router-dom.js?v=b7030666:4089:5)
    at Outlet (http://localhost:8080/node_modules/.vite/deps/react-router-dom.js?v=b7030666:4495:26)
    at div
    at main
    at div
    at Layout (http://localhost:8080/src/components/Layout.tsx?t=1758549303961:37:22)
    at RenderedRoute (http://localhost:8080/node_modules/.vite/deps/react-router-dom.js?v=b7030666:4089:5)
    at Routes (http://localhost:8080/node_modules/.vite/deps/react-router-dom.js?v=b7030666:4559:5)
    at ClientProvider (http://localhost:8080/src/context/ClientContext.tsx?t=1758546487915:27:34)
    at TaskProvider (http://localhost:8080/src/context/TaskContext.tsx?t=1758549272061:36:32)
    at ProjectProvider (http://localhost:8080/src/context/ProjectContext.tsx?t=1758549290295:41:35)
    at SessionContextProvider (http://localhost:8080/src/context/SessionContext.tsx?t=1758546487915:31:42)
    at Provider (http://localhost:8080/node_modules/.vite/deps/chunk-PSSEWZHR.js?v=b7030666:38:15)
    at TooltipProvider (http://localhost:8080/node_modules/.vite/deps/@radix-ui_react-tooltip.js?v=b7030666:65:5)
    at QueryClientProvider (http://localhost:8080/node_modules/.vite/deps/@tanstack_react-query.js?v=b7030666:2875:3)
    at ErrorBoundary (http://localhost:8080/src/components/ErrorBoundary/ErrorBoundary.tsx:272:5)
    at App
    at Router (http://localhost:8080/node_modules/.vite/deps/react-router-dom.js?v=b7030666:4502:15)
    at BrowserRouter (http://localhost:8080/node_modules/.vite/deps/react-router-dom.js?v=b7030666:5248:5)

React will try to recreate this component tree from scratch using the error boundary you provided, ErrorBoundary.
logCapturedError @ chunk-3VTW7PKX.js?v=b7030666:14080
callback @ chunk-3VTW7PKX.js?v=b7030666:14126
callCallback @ chunk-3VTW7PKX.js?v=b7030666:11296
commitUpdateQueue @ chunk-3VTW7PKX.js?v=b7030666:11313
commitLayoutEffectOnFiber @ chunk-3VTW7PKX.js?v=b7030666:17123
commitLayoutMountEffects_complete @ chunk-3VTW7PKX.js?v=b7030666:18030
commitLayoutEffects_begin @ chunk-3VTW7PKX.js?v=b7030666:18019
commitLayoutEffects @ chunk-3VTW7PKX.js?v=b7030666:17970
commitRootImpl @ chunk-3VTW7PKX.js?v=b7030666:19406
commitRoot @ chunk-3VTW7PKX.js?v=b7030666:19330
finishConcurrentRender @ chunk-3VTW7PKX.js?v=b7030666:18813
performConcurrentWorkOnRoot @ chunk-3VTW7PKX.js?v=b7030666:18768
workLoop @ chunk-3VTW7PKX.js?v=b7030666:197
flushWork @ chunk-3VTW7PKX.js?v=b7030666:176
performWorkUntilDeadline @ chunk-3VTW7PKX.js?v=b7030666:384
ErrorBoundary.tsx:29 Error caught by boundary: TypeError: Cannot read properties of undefined (reading 'filter')
    at ProjectCardComponent (ProjectCard.tsx:87:40)
    at renderWithHooks (chunk-3VTW7PKX.js?v=b7030666:11596:26)
    at updateFunctionComponent (chunk-3VTW7PKX.js?v=b7030666:14630:28)
    at updateSimpleMemoComponent (chunk-3VTW7PKX.js?v=b7030666:14511:18)
    at updateMemoComponent (chunk-3VTW7PKX.js?v=b7030666:14414:22)
    at beginWork (chunk-3VTW7PKX.js?v=b7030666:16025:22)
    at beginWork$1 (chunk-3VTW7PKX.js?v=b7030666:19806:22)
    at performUnitOfWork (chunk-3VTW7PKX.js?v=b7030666:19251:20)
    at workLoopSync (chunk-3VTW7PKX.js?v=b7030666:19190:13)
    at renderRootSync (chunk-3VTW7PKX.js?v=b7030666:19169:15) {componentStack: '\n    at ProjectCardComponent (http://localhost:808….vite/deps/react-router-dom.js?v=b7030666:5248:5)'}
componentDidCatch @ ErrorBoundary.tsx:29
callback @ chunk-3VTW7PKX.js?v=b7030666:14132
callCallback @ chunk-3VTW7PKX.js?v=b7030666:11296
commitUpdateQueue @ chunk-3VTW7PKX.js?v=b7030666:11313
commitLayoutEffectOnFiber @ chunk-3VTW7PKX.js?v=b7030666:17123
commitLayoutMountEffects_complete @ chunk-3VTW7PKX.js?v=b7030666:18030
commitLayoutEffects_begin @ chunk-3VTW7PKX.js?v=b7030666:18019
commitLayoutEffects @ chunk-3VTW7PKX.js?v=b7030666:17970
commitRootImpl @ chunk-3VTW7PKX.js?v=b7030666:19406
commitRoot @ chunk-3VTW7PKX.js?v=b7030666:19330
finishConcurrentRender @ chunk-3VTW7PKX.js?v=b7030666:18813
performConcurrentWorkOnRoot @ chunk-3VTW7PKX.js?v=b7030666:18768
workLoop @ chunk-3VTW7PKX.js?v=b7030666:197
flushWork @ chunk-3VTW7PKX.js?v=b7030666:176
performWorkUntilDeadline @ chunk-3VTW7PKX.js?v=b7030666:384
chunk-3VTW7PKX.js?v=b7030666:14080 The above error occurred in the <ProjectCardComponent> component:

    at ProjectCardComponent (http://localhost:8080/src/components/ProjectCard.tsx:88:33)
    at div
    at div
    at Projects (http://localhost:8080/src/pages/Projects.tsx?t=1758549290295:45:73)
    at Suspense
    at ErrorBoundary (http://localhost:8080/src/components/ErrorBoundary/ErrorBoundary.tsx:272:5)
    at PageErrorBoundary (http://localhost:8080/src/components/ErrorBoundary/ErrorBoundary.tsx:288:37)
    at LazyRoute (http://localhost:8080/src/App.tsx?t=1758549303961:82:22)
    at ProtectedRoute (http://localhost:8080/src/components/auth/ProtectedRoute.tsx?t=1758546487915:30:38)
    at RequireAuth (http://localhost:8080/src/components/auth/ProtectedRoute.tsx?t=1758546487915:179:35)
    at RenderedRoute (http://localhost:8080/node_modules/.vite/deps/react-router-dom.js?v=b7030666:4089:5)
    at Outlet (http://localhost:8080/node_modules/.vite/deps/react-router-dom.js?v=b7030666:4495:26)
    at div
    at main
    at div
    at Layout (http://localhost:8080/src/components/Layout.tsx?t=1758549303961:37:22)
    at RenderedRoute (http://localhost:8080/node_modules/.vite/deps/react-router-dom.js?v=b7030666:4089:5)
    at Routes (http://localhost:8080/node_modules/.vite/deps/react-router-dom.js?v=b7030666:4559:5)
    at ClientProvider (http://localhost:8080/src/context/ClientContext.tsx?t=1758546487915:27:34)
    at TaskProvider (http://localhost:8080/src/context/TaskContext.tsx?t=1758549272061:36:32)
    at ProjectProvider (http://localhost:8080/src/context/ProjectContext.tsx?t=1758549290295:41:35)
    at SessionContextProvider (http://localhost:8080/src/context/SessionContext.tsx?t=1758546487915:31:42)
    at Provider (http://localhost:8080/node_modules/.vite/deps/chunk-PSSEWZHR.js?v=b7030666:38:15)
    at TooltipProvider (http://localhost:8080/node_modules/.vite/deps/@radix-ui_react-tooltip.js?v=b7030666:65:5)
    at QueryClientProvider (http://localhost:8080/node_modules/.vite/deps/@tanstack_react-query.js?v=b7030666:2875:3)
    at ErrorBoundary (http://localhost:8080/src/components/ErrorBoundary/ErrorBoundary.tsx:272:5)
    at App
    at Router (http://localhost:8080/node_modules/.vite/deps/react-router-dom.js?v=b7030666:4502:15)
    at BrowserRouter (http://localhost:8080/node_modules/.vite/deps/react-router-dom.js?v=b7030666:5248:5)

React will try to recreate this component tree from scratch using the error boundary you provided, ErrorBoundary.
logCapturedError @ chunk-3VTW7PKX.js?v=b7030666:14080
callback @ chunk-3VTW7PKX.js?v=b7030666:14126
callCallback @ chunk-3VTW7PKX.js?v=b7030666:11296
commitUpdateQueue @ chunk-3VTW7PKX.js?v=b7030666:11313
commitLayoutEffectOnFiber @ chunk-3VTW7PKX.js?v=b7030666:17123
commitLayoutMountEffects_complete @ chunk-3VTW7PKX.js?v=b7030666:18030
commitLayoutEffects_begin @ chunk-3VTW7PKX.js?v=b7030666:18019
commitLayoutEffects @ chunk-3VTW7PKX.js?v=b7030666:17970
commitRootImpl @ chunk-3VTW7PKX.js?v=b7030666:19406
commitRoot @ chunk-3VTW7PKX.js?v=b7030666:19330
finishConcurrentRender @ chunk-3VTW7PKX.js?v=b7030666:18813
performConcurrentWorkOnRoot @ chunk-3VTW7PKX.js?v=b7030666:18768
workLoop @ chunk-3VTW7PKX.js?v=b7030666:197
flushWork @ chunk-3VTW7PKX.js?v=b7030666:176
performWorkUntilDeadline @ chunk-3VTW7PKX.js?v=b7030666:384
ErrorBoundary.tsx:29 Error caught by boundary: TypeError: Cannot read properties of undefined (reading 'filter')
    at ProjectCardComponent (ProjectCard.tsx:87:40)
    at renderWithHooks (chunk-3VTW7PKX.js?v=b7030666:11596:26)
    at updateFunctionComponent (chunk-3VTW7PKX.js?v=b7030666:14630:28)
    at updateSimpleMemoComponent (chunk-3VTW7PKX.js?v=b7030666:14511:18)
    at updateMemoComponent (chunk-3VTW7PKX.js?v=b7030666:14414:22)
    at beginWork (chunk-3VTW7PKX.js?v=b7030666:16025:22)
    at beginWork$1 (chunk-3VTW7PKX.js?v=b7030666:19806:22)
    at performUnitOfWork (chunk-3VTW7PKX.js?v=b7030666:19251:20)
    at workLoopSync (chunk-3VTW7PKX.js?v=b7030666:19190:13)
    at renderRootSync (chunk-3VTW7PKX.js?v=b7030666:19169:15) {componentStack: '\n    at ProjectCardComponent (http://localhost:808….vite/deps/react-router-dom.js?v=b7030666:5248:5)'}
componentDidCatch @ ErrorBoundary.tsx:29
callback @ chunk-3VTW7PKX.js?v=b7030666:14132
callCallback @ chunk-3VTW7PKX.js?v=b7030666:11296
commitUpdateQueue @ chunk-3VTW7PKX.js?v=b7030666:11313
commitLayoutEffectOnFiber @ chunk-3VTW7PKX.js?v=b7030666:17123
commitLayoutMountEffects_complete @ chunk-3VTW7PKX.js?v=b7030666:18030
commitLayoutEffects_begin @ chunk-3VTW7PKX.js?v=b7030666:18019
commitLayoutEffects @ chunk-3VTW7PKX.js?v=b7030666:17970
commitRootImpl @ chunk-3VTW7PKX.js?v=b7030666:19406
commitRoot @ chunk-3VTW7PKX.js?v=b7030666:19330
finishConcurrentRender @ chunk-3VTW7PKX.js?v=b7030666:18813
performConcurrentWorkOnRoot @ chunk-3VTW7PKX.js?v=b7030666:18768
workLoop @ chunk-3VTW7PKX.js?v=b7030666:197
flushWork @ chunk-3VTW7PKX.js?v=b7030666:176
performWorkUntilDeadline @ chunk-3VTW7PKX.js?v=b7030666:384
chunk-3VTW7PKX.js?v=b7030666:14080 The above error occurred in the <ProjectCardComponent> component:

    at ProjectCardComponent (http://localhost:8080/src/components/ProjectCard.tsx:88:33)
    at div
    at div
    at Projects (http://localhost:8080/src/pages/Projects.tsx?t=1758549290295:45:73)
    at Suspense
    at ErrorBoundary (http://localhost:8080/src/components/ErrorBoundary/ErrorBoundary.tsx:272:5)
    at PageErrorBoundary (http://localhost:8080/src/components/ErrorBoundary/ErrorBoundary.tsx:288:37)
    at LazyRoute (http://localhost:8080/src/App.tsx?t=1758549303961:82:22)
    at ProtectedRoute (http://localhost:8080/src/components/auth/ProtectedRoute.tsx?t=1758546487915:30:38)
    at RequireAuth (http://localhost:8080/src/components/auth/ProtectedRoute.tsx?t=1758546487915:179:35)
    at RenderedRoute (http://localhost:8080/node_modules/.vite/deps/react-router-dom.js?v=b7030666:4089:5)
    at Outlet (http://localhost:8080/node_modules/.vite/deps/react-router-dom.js?v=b7030666:4495:26)
    at div
    at main
    at div
    at Layout (http://localhost:8080/src/components/Layout.tsx?t=1758549303961:37:22)
    at RenderedRoute (http://localhost:8080/node_modules/.vite/deps/react-router-dom.js?v=b7030666:4089:5)
    at Routes (http://localhost:8080/node_modules/.vite/deps/react-router-dom.js?v=b7030666:4559:5)
    at ClientProvider (http://localhost:8080/src/context/ClientContext.tsx?t=1758546487915:27:34)
    at TaskProvider (http://localhost:8080/src/context/TaskContext.tsx?t=1758549272061:36:32)
    at ProjectProvider (http://localhost:8080/src/context/ProjectContext.tsx?t=1758549290295:41:35)
    at SessionContextProvider (http://localhost:8080/src/context/SessionContext.tsx?t=1758546487915:31:42)
    at Provider (http://localhost:8080/node_modules/.vite/deps/chunk-PSSEWZHR.js?v=b7030666:38:15)
    at TooltipProvider (http://localhost:8080/node_modules/.vite/deps/@radix-ui_react-tooltip.js?v=b7030666:65:5)
    at QueryClientProvider (http://localhost:8080/node_modules/.vite/deps/@tanstack_react-query.js?v=b7030666:2875:3)
    at ErrorBoundary (http://localhost:8080/src/components/ErrorBoundary/ErrorBoundary.tsx:272:5)
    at App
    at Router (http://localhost:8080/node_modules/.vite/deps/react-router-dom.js?v=b7030666:4502:15)
    at BrowserRouter (http://localhost:8080/node_modules/.vite/deps/react-router-dom.js?v=b7030666:5248:5)

React will try to recreate this component tree from scratch using the error boundary you provided, ErrorBoundary.
logCapturedError @ chunk-3VTW7PKX.js?v=b7030666:14080
callback @ chunk-3VTW7PKX.js?v=b7030666:14126
callCallback @ chunk-3VTW7PKX.js?v=b7030666:11296
commitUpdateQueue @ chunk-3VTW7PKX.js?v=b7030666:11313
commitLayoutEffectOnFiber @ chunk-3VTW7PKX.js?v=b7030666:17123
commitLayoutMountEffects_complete @ chunk-3VTW7PKX.js?v=b7030666:18030
commitLayoutEffects_begin @ chunk-3VTW7PKX.js?v=b7030666:18019
commitLayoutEffects @ chunk-3VTW7PKX.js?v=b7030666:17970
commitRootImpl @ chunk-3VTW7PKX.js?v=b7030666:19406
commitRoot @ chunk-3VTW7PKX.js?v=b7030666:19330
finishConcurrentRender @ chunk-3VTW7PKX.js?v=b7030666:18813
performConcurrentWorkOnRoot @ chunk-3VTW7PKX.js?v=b7030666:18768
workLoop @ chunk-3VTW7PKX.js?v=b7030666:197
flushWork @ chunk-3VTW7PKX.js?v=b7030666:176
performWorkUntilDeadline @ chunk-3VTW7PKX.js?v=b7030666:384
ErrorBoundary.tsx:29 Error caught by boundary: TypeError: Cannot read properties of undefined (reading 'filter')
    at ProjectCardComponent (ProjectCard.tsx:87:40)
    at renderWithHooks (chunk-3VTW7PKX.js?v=b7030666:11596:26)
    at updateFunctionComponent (chunk-3VTW7PKX.js?v=b7030666:14630:28)
    at updateSimpleMemoComponent (chunk-3VTW7PKX.js?v=b7030666:14511:18)
    at updateMemoComponent (chunk-3VTW7PKX.js?v=b7030666:14414:22)
    at beginWork (chunk-3VTW7PKX.js?v=b7030666:16025:22)
    at beginWork$1 (chunk-3VTW7PKX.js?v=b7030666:19806:22)
    at performUnitOfWork (chunk-3VTW7PKX.js?v=b7030666:19251:20)
    at workLoopSync (chunk-3VTW7PKX.js?v=b7030666:19190:13)
    at renderRootSync (chunk-3VTW7PKX.js?v=b7030666:19169:15) {componentStack: '\n    at ProjectCardComponent (http://localhost:808….vite/deps/react-router-dom.js?v=b7030666:5248:5)'}
componentDidCatch @ ErrorBoundary.tsx:29
callback @ chunk-3VTW7PKX.js?v=b7030666:14132
callCallback @ chunk-3VTW7PKX.js?v=b7030666:11296
commitUpdateQueue @ chunk-3VTW7PKX.js?v=b7030666:11313
commitLayoutEffectOnFiber @ chunk-3VTW7PKX.js?v=b7030666:17123
commitLayoutMountEffects_complete @ chunk-3VTW7PKX.js?v=b7030666:18030
commitLayoutEffects_begin @ chunk-3VTW7PKX.js?v=b7030666:18019
commitLayoutEffects @ chunk-3VTW7PKX.js?v=b7030666:17970
commitRootImpl @ chunk-3VTW7PKX.js?v=b7030666:19406
commitRoot @ chunk-3VTW7PKX.js?v=b7030666:19330
finishConcurrentRender @ chunk-3VTW7PKX.js?v=b7030666:18813
performConcurrentWorkOnRoot @ chunk-3VTW7PKX.js?v=b7030666:18768
workLoop @ chunk-3VTW7PKX.js?v=b7030666:197
flushWork @ chunk-3VTW7PKX.js?v=b7030666:176
performWorkUntilDeadline @ chunk-3VTW7PKX.js?v=b7030666:384
chunk-3VTW7PKX.js?v=b7030666:14080 The above error occurred in the <ProjectCardComponent> component:

    at ProjectCardComponent (http://localhost:8080/src/components/ProjectCard.tsx:88:33)
    at div
    at div
    at Projects (http://localhost:8080/src/pages/Projects.tsx?t=1758549290295:45:73)
    at Suspense
    at ErrorBoundary (http://localhost:8080/src/components/ErrorBoundary/ErrorBoundary.tsx:272:5)
    at PageErrorBoundary (http://localhost:8080/src/components/ErrorBoundary/ErrorBoundary.tsx:288:37)
    at LazyRoute (http://localhost:8080/src/App.tsx?t=1758549303961:82:22)
    at ProtectedRoute (http://localhost:8080/src/components/auth/ProtectedRoute.tsx?t=1758546487915:30:38)
    at RequireAuth (http://localhost:8080/src/components/auth/ProtectedRoute.tsx?t=1758546487915:179:35)
    at RenderedRoute (http://localhost:8080/node_modules/.vite/deps/react-router-dom.js?v=b7030666:4089:5)
    at Outlet (http://localhost:8080/node_modules/.vite/deps/react-router-dom.js?v=b7030666:4495:26)
    at div
    at main
    at div
    at Layout (http://localhost:8080/src/components/Layout.tsx?t=1758549303961:37:22)
    at RenderedRoute (http://localhost:8080/node_modules/.vite/deps/react-router-dom.js?v=b7030666:4089:5)
    at Routes (http://localhost:8080/node_modules/.vite/deps/react-router-dom.js?v=b7030666:4559:5)
    at ClientProvider (http://localhost:8080/src/context/ClientContext.tsx?t=1758546487915:27:34)
    at TaskProvider (http://localhost:8080/src/context/TaskContext.tsx?t=1758549272061:36:32)
    at ProjectProvider (http://localhost:8080/src/context/ProjectContext.tsx?t=1758549290295:41:35)
    at SessionContextProvider (http://localhost:8080/src/context/SessionContext.tsx?t=1758546487915:31:42)
    at Provider (http://localhost:8080/node_modules/.vite/deps/chunk-PSSEWZHR.js?v=b7030666:38:15)
    at TooltipProvider (http://localhost:8080/node_modules/.vite/deps/@radix-ui_react-tooltip.js?v=b7030666:65:5)
    at QueryClientProvider (http://localhost:8080/node_modules/.vite/deps/@tanstack_react-query.js?v=b7030666:2875:3)
    at ErrorBoundary (http://localhost:8080/src/components/ErrorBoundary/ErrorBoundary.tsx:272:5)
    at App
    at Router (http://localhost:8080/node_modules/.vite/deps/react-router-dom.js?v=b7030666:4502:15)
    at BrowserRouter (http://localhost:8080/node_modules/.vite/deps/react-router-dom.js?v=b7030666:5248:5)

React will try to recreate this component tree from scratch using the error boundary you provided, ErrorBoundary.
logCapturedError @ chunk-3VTW7PKX.js?v=b7030666:14080
callback @ chunk-3VTW7PKX.js?v=b7030666:14126
callCallback @ chunk-3VTW7PKX.js?v=b7030666:11296
commitUpdateQueue @ chunk-3VTW7PKX.js?v=b7030666:11313
commitLayoutEffectOnFiber @ chunk-3VTW7PKX.js?v=b7030666:17123
commitLayoutMountEffects_complete @ chunk-3VTW7PKX.js?v=b7030666:18030
commitLayoutEffects_begin @ chunk-3VTW7PKX.js?v=b7030666:18019
commitLayoutEffects @ chunk-3VTW7PKX.js?v=b7030666:17970
commitRootImpl @ chunk-3VTW7PKX.js?v=b7030666:19406
commitRoot @ chunk-3VTW7PKX.js?v=b7030666:19330
finishConcurrentRender @ chunk-3VTW7PKX.js?v=b7030666:18813
performConcurrentWorkOnRoot @ chunk-3VTW7PKX.js?v=b7030666:18768
workLoop @ chunk-3VTW7PKX.js?v=b7030666:197
flushWork @ chunk-3VTW7PKX.js?v=b7030666:176
performWorkUntilDeadline @ chunk-3VTW7PKX.js?v=b7030666:384
ErrorBoundary.tsx:29 Error caught by boundary: TypeError: Cannot read properties of undefined (reading 'filter')
    at ProjectCardComponent (ProjectCard.tsx:87:40)
    at renderWithHooks (chunk-3VTW7PKX.js?v=b7030666:11596:26)
    at updateFunctionComponent (chunk-3VTW7PKX.js?v=b7030666:14630:28)
    at updateSimpleMemoComponent (chunk-3VTW7PKX.js?v=b7030666:14511:18)
    at updateMemoComponent (chunk-3VTW7PKX.js?v=b7030666:14414:22)
    at beginWork (chunk-3VTW7PKX.js?v=b7030666:16025:22)
    at beginWork$1 (chunk-3VTW7PKX.js?v=b7030666:19806:22)
    at performUnitOfWork (chunk-3VTW7PKX.js?v=b7030666:19251:20)
    at workLoopSync (chunk-3VTW7PKX.js?v=b7030666:19190:13)
    at renderRootSync (chunk-3VTW7PKX.js?v=b7030666:19169:15) {componentStack: '\n    at ProjectCardComponent (http://localhost:808….vite/deps/react-router-dom.js?v=b7030666:5248:5)'}
componentDidCatch @ ErrorBoundary.tsx:29
callback @ chunk-3VTW7PKX.js?v=b7030666:14132
callCallback @ chunk-3VTW7PKX.js?v=b7030666:11296
commitUpdateQueue @ chunk-3VTW7PKX.js?v=b7030666:11313
commitLayoutEffectOnFiber @ chunk-3VTW7PKX.js?v=b7030666:17123
commitLayoutMountEffects_complete @ chunk-3VTW7PKX.js?v=b7030666:18030
commitLayoutEffects_begin @ chunk-3VTW7PKX.js?v=b7030666:18019
commitLayoutEffects @ chunk-3VTW7PKX.js?v=b7030666:17970
commitRootImpl @ chunk-3VTW7PKX.js?v=b7030666:19406
commitRoot @ chunk-3VTW7PKX.js?v=b7030666:19330
finishConcurrentRender @ chunk-3VTW7PKX.js?v=b7030666:18813
performConcurrentWorkOnRoot @ chunk-3VTW7PKX.js?v=b7030666:18768
workLoop @ chunk-3VTW7PKX.js?v=b7030666:197
flushWork @ chunk-3VTW7PKX.js?v=b7030666:176
performWorkUntilDeadline @ chunk-3VTW7PKX.js?v=b7030666:384
chunk-3VTW7PKX.js?v=b7030666:14080 The above error occurred in the <ProjectCardComponent> component:

    at ProjectCardComponent (http://localhost:8080/src/components/ProjectCard.tsx:88:33)
    at div
    at div
    at Projects (http://localhost:8080/src/pages/Projects.tsx?t=1758549290295:45:73)
    at Suspense
    at ErrorBoundary (http://localhost:8080/src/components/ErrorBoundary/ErrorBoundary.tsx:272:5)
    at PageErrorBoundary (http://localhost:8080/src/components/ErrorBoundary/ErrorBoundary.tsx:288:37)
    at LazyRoute (http://localhost:8080/src/App.tsx?t=1758549303961:82:22)
    at ProtectedRoute (http://localhost:8080/src/components/auth/ProtectedRoute.tsx?t=1758546487915:30:38)
    at RequireAuth (http://localhost:8080/src/components/auth/ProtectedRoute.tsx?t=1758546487915:179:35)
    at RenderedRoute (http://localhost:8080/node_modules/.vite/deps/react-router-dom.js?v=b7030666:4089:5)
    at Outlet (http://localhost:8080/node_modules/.vite/deps/react-router-dom.js?v=b7030666:4495:26)
    at div
    at main
    at div
    at Layout (http://localhost:8080/src/components/Layout.tsx?t=1758549303961:37:22)
    at RenderedRoute (http://localhost:8080/node_modules/.vite/deps/react-router-dom.js?v=b7030666:4089:5)
    at Routes (http://localhost:8080/node_modules/.vite/deps/react-router-dom.js?v=b7030666:4559:5)
    at ClientProvider (http://localhost:8080/src/context/ClientContext.tsx?t=1758546487915:27:34)
    at TaskProvider (http://localhost:8080/src/context/TaskContext.tsx?t=1758549272061:36:32)
    at ProjectProvider (http://localhost:8080/src/context/ProjectContext.tsx?t=1758549290295:41:35)
    at SessionContextProvider (http://localhost:8080/src/context/SessionContext.tsx?t=1758546487915:31:42)
    at Provider (http://localhost:8080/node_modules/.vite/deps/chunk-PSSEWZHR.js?v=b7030666:38:15)
    at TooltipProvider (http://localhost:8080/node_modules/.vite/deps/@radix-ui_react-tooltip.js?v=b7030666:65:5)
    at QueryClientProvider (http://localhost:8080/node_modules/.vite/deps/@tanstack_react-query.js?v=b7030666:2875:3)
    at ErrorBoundary (http://localhost:8080/src/components/ErrorBoundary/ErrorBoundary.tsx:272:5)
    at App
    at Router (http://localhost:8080/node_modules/.vite/deps/react-router-dom.js?v=b7030666:4502:15)
    at BrowserRouter (http://localhost:8080/node_modules/.vite/deps/react-router-dom.js?v=b7030666:5248:5)

React will try to recreate this component tree from scratch using the error boundary you provided, ErrorBoundary.
logCapturedError @ chunk-3VTW7PKX.js?v=b7030666:14080
callback @ chunk-3VTW7PKX.js?v=b7030666:14126
callCallback @ chunk-3VTW7PKX.js?v=b7030666:11296
commitUpdateQueue @ chunk-3VTW7PKX.js?v=b7030666:11313
commitLayoutEffectOnFiber @ chunk-3VTW7PKX.js?v=b7030666:17123
commitLayoutMountEffects_complete @ chunk-3VTW7PKX.js?v=b7030666:18030
commitLayoutEffects_begin @ chunk-3VTW7PKX.js?v=b7030666:18019
commitLayoutEffects @ chunk-3VTW7PKX.js?v=b7030666:17970
commitRootImpl @ chunk-3VTW7PKX.js?v=b7030666:19406
commitRoot @ chunk-3VTW7PKX.js?v=b7030666:19330
finishConcurrentRender @ chunk-3VTW7PKX.js?v=b7030666:18813
performConcurrentWorkOnRoot @ chunk-3VTW7PKX.js?v=b7030666:18768
workLoop @ chunk-3VTW7PKX.js?v=b7030666:197
flushWork @ chunk-3VTW7PKX.js?v=b7030666:176
performWorkUntilDeadline @ chunk-3VTW7PKX.js?v=b7030666:384
ErrorBoundary.tsx:29 Error caught by boundary: TypeError: Cannot read properties of undefined (reading 'filter')
    at ProjectCardComponent (ProjectCard.tsx:87:40)
    at renderWithHooks (chunk-3VTW7PKX.js?v=b7030666:11596:26)
    at updateFunctionComponent (chunk-3VTW7PKX.js?v=b7030666:14630:28)
    at updateSimpleMemoComponent (chunk-3VTW7PKX.js?v=b7030666:14511:18)
    at updateMemoComponent (chunk-3VTW7PKX.js?v=b7030666:14414:22)
    at beginWork (chunk-3VTW7PKX.js?v=b7030666:16025:22)
    at beginWork$1 (chunk-3VTW7PKX.js?v=b7030666:19806:22)
    at performUnitOfWork (chunk-3VTW7PKX.js?v=b7030666:19251:20)
    at workLoopSync (chunk-3VTW7PKX.js?v=b7030666:19190:13)
    at renderRootSync (chunk-3VTW7PKX.js?v=b7030666:19169:15) {componentStack: '\n    at ProjectCardComponent (http://localhost:808….vite/deps/react-router-dom.js?v=b7030666:5248:5)'}
componentDidCatch @ ErrorBoundary.tsx:29
callback @ chunk-3VTW7PKX.js?v=b7030666:14132
callCallback @ chunk-3VTW7PKX.js?v=b7030666:11296
commitUpdateQueue @ chunk-3VTW7PKX.js?v=b7030666:11313
commitLayoutEffectOnFiber @ chunk-3VTW7PKX.js?v=b7030666:17123
commitLayoutMountEffects_complete @ chunk-3VTW7PKX.js?v=b7030666:18030
commitLayoutEffects_begin @ chunk-3VTW7PKX.js?v=b7030666:18019
commitLayoutEffects @ chunk-3VTW7PKX.js?v=b7030666:17970
commitRootImpl @ chunk-3VTW7PKX.js?v=b7030666:19406
commitRoot @ chunk-3VTW7PKX.js?v=b7030666:19330
finishConcurrentRender @ chunk-3VTW7PKX.js?v=b7030666:18813
performConcurrentWorkOnRoot @ chunk-3VTW7PKX.js?v=b7030666:18768
workLoop @ chunk-3VTW7PKX.js?v=b7030666:197
flushWork @ chunk-3VTW7PKX.js?v=b7030666:176
performWorkUntilDeadline @ chunk-3VTW7PKX.js?v=b7030666:384
chunk-3VTW7PKX.js?v=b7030666:14080 The above error occurred in the <ProjectCardComponent> component:

    at ProjectCardComponent (http://localhost:8080/src/components/ProjectCard.tsx:88:33)
    at div
    at div
    at Projects (http://localhost:8080/src/pages/Projects.tsx?t=1758549290295:45:73)
    at Suspense
    at ErrorBoundary (http://localhost:8080/src/components/ErrorBoundary/ErrorBoundary.tsx:272:5)
    at PageErrorBoundary (http://localhost:8080/src/components/ErrorBoundary/ErrorBoundary.tsx:288:37)
    at LazyRoute (http://localhost:8080/src/App.tsx?t=1758549303961:82:22)
    at ProtectedRoute (http://localhost:8080/src/components/auth/ProtectedRoute.tsx?t=1758546487915:30:38)
    at RequireAuth (http://localhost:8080/src/components/auth/ProtectedRoute.tsx?t=1758546487915:179:35)
    at RenderedRoute (http://localhost:8080/node_modules/.vite/deps/react-router-dom.js?v=b7030666:4089:5)
    at Outlet (http://localhost:8080/node_modules/.vite/deps/react-router-dom.js?v=b7030666:4495:26)
    at div
    at main
    at div
    at Layout (http://localhost:8080/src/components/Layout.tsx?t=1758549303961:37:22)
    at RenderedRoute (http://localhost:8080/node_modules/.vite/deps/react-router-dom.js?v=b7030666:4089:5)
    at Routes (http://localhost:8080/node_modules/.vite/deps/react-router-dom.js?v=b7030666:4559:5)
    at ClientProvider (http://localhost:8080/src/context/ClientContext.tsx?t=1758546487915:27:34)
    at TaskProvider (http://localhost:8080/src/context/TaskContext.tsx?t=1758549272061:36:32)
    at ProjectProvider (http://localhost:8080/src/context/ProjectContext.tsx?t=1758549290295:41:35)
    at SessionContextProvider (http://localhost:8080/src/context/SessionContext.tsx?t=1758546487915:31:42)
    at Provider (http://localhost:8080/node_modules/.vite/deps/chunk-PSSEWZHR.js?v=b7030666:38:15)
    at TooltipProvider (http://localhost:8080/node_modules/.vite/deps/@radix-ui_react-tooltip.js?v=b7030666:65:5)
    at QueryClientProvider (http://localhost:8080/node_modules/.vite/deps/@tanstack_react-query.js?v=b7030666:2875:3)
    at ErrorBoundary (http://localhost:8080/src/components/ErrorBoundary/ErrorBoundary.tsx:272:5)
    at App
    at Router (http://localhost:8080/node_modules/.vite/deps/react-router-dom.js?v=b7030666:4502:15)
    at BrowserRouter (http://localhost:8080/node_modules/.vite/deps/react-router-dom.js?v=b7030666:5248:5)

React will try to recreate this component tree from scratch using the error boundary you provided, ErrorBoundary.
logCapturedError @ chunk-3VTW7PKX.js?v=b7030666:14080
callback @ chunk-3VTW7PKX.js?v=b7030666:14126
callCallback @ chunk-3VTW7PKX.js?v=b7030666:11296
commitUpdateQueue @ chunk-3VTW7PKX.js?v=b7030666:11313
commitLayoutEffectOnFiber @ chunk-3VTW7PKX.js?v=b7030666:17123
commitLayoutMountEffects_complete @ chunk-3VTW7PKX.js?v=b7030666:18030
commitLayoutEffects_begin @ chunk-3VTW7PKX.js?v=b7030666:18019
commitLayoutEffects @ chunk-3VTW7PKX.js?v=b7030666:17970
commitRootImpl @ chunk-3VTW7PKX.js?v=b7030666:19406
commitRoot @ chunk-3VTW7PKX.js?v=b7030666:19330
finishConcurrentRender @ chunk-3VTW7PKX.js?v=b7030666:18813
performConcurrentWorkOnRoot @ chunk-3VTW7PKX.js?v=b7030666:18768
workLoop @ chunk-3VTW7PKX.js?v=b7030666:197
flushWork @ chunk-3VTW7PKX.js?v=b7030666:176
performWorkUntilDeadline @ chunk-3VTW7PKX.js?v=b7030666:384
ErrorBoundary.tsx:29 Error caught by boundary: TypeError: Cannot read properties of undefined (reading 'filter')
    at ProjectCardComponent (ProjectCard.tsx:87:40)
    at renderWithHooks (chunk-3VTW7PKX.js?v=b7030666:11596:26)
    at updateFunctionComponent (chunk-3VTW7PKX.js?v=b7030666:14630:28)
    at updateSimpleMemoComponent (chunk-3VTW7PKX.js?v=b7030666:14511:18)
    at updateMemoComponent (chunk-3VTW7PKX.js?v=b7030666:14414:22)
    at beginWork (chunk-3VTW7PKX.js?v=b7030666:16025:22)
    at beginWork$1 (chunk-3VTW7PKX.js?v=b7030666:19806:22)
    at performUnitOfWork (chunk-3VTW7PKX.js?v=b7030666:19251:20)
    at workLoopSync (chunk-3VTW7PKX.js?v=b7030666:19190:13)
    at renderRootSync (chunk-3VTW7PKX.js?v=b7030666:19169:15) {componentStack: '\n    at ProjectCardComponent (http://localhost:808….vite/deps/react-router-dom.js?v=b7030666:5248:5)'}
componentDidCatch @ ErrorBoundary.tsx:29
callback @ chunk-3VTW7PKX.js?v=b7030666:14132
callCallback @ chunk-3VTW7PKX.js?v=b7030666:11296
commitUpdateQueue @ chunk-3VTW7PKX.js?v=b7030666:11313
commitLayoutEffectOnFiber @ chunk-3VTW7PKX.js?v=b7030666:17123
commitLayoutMountEffects_complete @ chunk-3VTW7PKX.js?v=b7030666:18030
commitLayoutEffects_begin @ chunk-3VTW7PKX.js?v=b7030666:18019
commitLayoutEffects @ chunk-3VTW7PKX.js?v=b7030666:17970
commitRootImpl @ chunk-3VTW7PKX.js?v=b7030666:19406
commitRoot @ chunk-3VTW7PKX.js?v=b7030666:19330
finishConcurrentRender @ chunk-3VTW7PKX.js?v=b7030666:18813
performConcurrentWorkOnRoot @ chunk-3VTW7PKX.js?v=b7030666:18768
workLoop @ chunk-3VTW7PKX.js?v=b7030666:197
flushWork @ chunk-3VTW7PKX.js?v=b7030666:176
performWorkUntilDeadline @ chunk-3VTW7PKX.js?v=b7030666:384
chunk-3VTW7PKX.js?v=b7030666:14080 The above error occurred in the <ProjectCardComponent> component:

    at ProjectCardComponent (http://localhost:8080/src/components/ProjectCard.tsx:88:33)
    at div
    at div
    at Projects (http://localhost:8080/src/pages/Projects.tsx?t=1758549290295:45:73)
    at Suspense
    at ErrorBoundary (http://localhost:8080/src/components/ErrorBoundary/ErrorBoundary.tsx:272:5)
    at PageErrorBoundary (http://localhost:8080/src/components/ErrorBoundary/ErrorBoundary.tsx:288:37)
    at LazyRoute (http://localhost:8080/src/App.tsx?t=1758549303961:82:22)
    at ProtectedRoute (http://localhost:8080/src/components/auth/ProtectedRoute.tsx?t=1758546487915:30:38)
    at RequireAuth (http://localhost:8080/src/components/auth/ProtectedRoute.tsx?t=1758546487915:179:35)
    at RenderedRoute (http://localhost:8080/node_modules/.vite/deps/react-router-dom.js?v=b7030666:4089:5)
    at Outlet (http://localhost:8080/node_modules/.vite/deps/react-router-dom.js?v=b7030666:4495:26)
    at div
    at main
    at div
    at Layout (http://localhost:8080/src/components/Layout.tsx?t=1758549303961:37:22)
    at RenderedRoute (http://localhost:8080/node_modules/.vite/deps/react-router-dom.js?v=b7030666:4089:5)
    at Routes (http://localhost:8080/node_modules/.vite/deps/react-router-dom.js?v=b7030666:4559:5)
    at ClientProvider (http://localhost:8080/src/context/ClientContext.tsx?t=1758546487915:27:34)
    at TaskProvider (http://localhost:8080/src/context/TaskContext.tsx?t=1758549272061:36:32)
    at ProjectProvider (http://localhost:8080/src/context/ProjectContext.tsx?t=1758549290295:41:35)
    at SessionContextProvider (http://localhost:8080/src/context/SessionContext.tsx?t=1758546487915:31:42)
    at Provider (http://localhost:8080/node_modules/.vite/deps/chunk-PSSEWZHR.js?v=b7030666:38:15)
    at TooltipProvider (http://localhost:8080/node_modules/.vite/deps/@radix-ui_react-tooltip.js?v=b7030666:65:5)
    at QueryClientProvider (http://localhost:8080/node_modules/.vite/deps/@tanstack_react-query.js?v=b7030666:2875:3)
    at ErrorBoundary (http://localhost:8080/src/components/ErrorBoundary/ErrorBoundary.tsx:272:5)
    at App
    at Router (http://localhost:8080/node_modules/.vite/deps/react-router-dom.js?v=b7030666:4502:15)
    at BrowserRouter (http://localhost:8080/node_modules/.vite/deps/react-router-dom.js?v=b7030666:5248:5)

React will try to recreate this component tree from scratch using the error boundary you provided, ErrorBoundary.
logCapturedError @ chunk-3VTW7PKX.js?v=b7030666:14080
callback @ chunk-3VTW7PKX.js?v=b7030666:14126
callCallback @ chunk-3VTW7PKX.js?v=b7030666:11296
commitUpdateQueue @ chunk-3VTW7PKX.js?v=b7030666:11313
commitLayoutEffectOnFiber @ chunk-3VTW7PKX.js?v=b7030666:17123
commitLayoutMountEffects_complete @ chunk-3VTW7PKX.js?v=b7030666:18030
commitLayoutEffects_begin @ chunk-3VTW7PKX.js?v=b7030666:18019
commitLayoutEffects @ chunk-3VTW7PKX.js?v=b7030666:17970
commitRootImpl @ chunk-3VTW7PKX.js?v=b7030666:19406
commitRoot @ chunk-3VTW7PKX.js?v=b7030666:19330
finishConcurrentRender @ chunk-3VTW7PKX.js?v=b7030666:18813
performConcurrentWorkOnRoot @ chunk-3VTW7PKX.js?v=b7030666:18768
workLoop @ chunk-3VTW7PKX.js?v=b7030666:197
flushWork @ chunk-3VTW7PKX.js?v=b7030666:176
performWorkUntilDeadline @ chunk-3VTW7PKX.js?v=b7030666:384
ErrorBoundary.tsx:29 Error caught by boundary: TypeError: Cannot read properties of undefined (reading 'filter')
    at ProjectCardComponent (ProjectCard.tsx:87:40)
    at renderWithHooks (chunk-3VTW7PKX.js?v=b7030666:11596:26)
    at updateFunctionComponent (chunk-3VTW7PKX.js?v=b7030666:14630:28)
    at updateSimpleMemoComponent (chunk-3VTW7PKX.js?v=b7030666:14511:18)
    at updateMemoComponent (chunk-3VTW7PKX.js?v=b7030666:14414:22)
    at beginWork (chunk-3VTW7PKX.js?v=b7030666:16025:22)
    at beginWork$1 (chunk-3VTW7PKX.js?v=b7030666:19806:22)
    at performUnitOfWork (chunk-3VTW7PKX.js?v=b7030666:19251:20)
    at workLoopSync (chunk-3VTW7PKX.js?v=b7030666:19190:13)
    at renderRootSync (chunk-3VTW7PKX.js?v=b7030666:19169:15) {componentStack: '\n    at ProjectCardComponent (http://localhost:808….vite/deps/react-router-dom.js?v=b7030666:5248:5)'}
componentDidCatch @ ErrorBoundary.tsx:29
callback @ chunk-3VTW7PKX.js?v=b7030666:14132
callCallback @ chunk-3VTW7PKX.js?v=b7030666:11296
commitUpdateQueue @ chunk-3VTW7PKX.js?v=b7030666:11313
commitLayoutEffectOnFiber @ chunk-3VTW7PKX.js?v=b7030666:17123
commitLayoutMountEffects_complete @ chunk-3VTW7PKX.js?v=b7030666:18030
commitLayoutEffects_begin @ chunk-3VTW7PKX.js?v=b7030666:18019
commitLayoutEffects @ chunk-3VTW7PKX.js?v=b7030666:17970
commitRootImpl @ chunk-3VTW7PKX.js?v=b7030666:19406
commitRoot @ chunk-3VTW7PKX.js?v=b7030666:19330
finishConcurrentRender @ chunk-3VTW7PKX.js?v=b7030666:18813
performConcurrentWorkOnRoot @ chunk-3VTW7PKX.js?v=b7030666:18768
workLoop @ chunk-3VTW7PKX.js?v=b7030666:197
flushWork @ chunk-3VTW7PKX.js?v=b7030666:176
performWorkUntilDeadline @ chunk-3VTW7PKX.js?v=b7030666:384
chunk-3VTW7PKX.js?v=b7030666:14080 The above error occurred in the <ProjectCardComponent> component:

    at ProjectCardComponent (http://localhost:8080/src/components/ProjectCard.tsx:88:33)
    at div
    at div
    at Projects (http://localhost:8080/src/pages/Projects.tsx?t=1758549290295:45:73)
    at Suspense
    at ErrorBoundary (http://localhost:8080/src/components/ErrorBoundary/ErrorBoundary.tsx:272:5)
    at PageErrorBoundary (http://localhost:8080/src/components/ErrorBoundary/ErrorBoundary.tsx:288:37)
    at LazyRoute (http://localhost:8080/src/App.tsx?t=1758549303961:82:22)
    at ProtectedRoute (http://localhost:8080/src/components/auth/ProtectedRoute.tsx?t=1758546487915:30:38)
    at RequireAuth (http://localhost:8080/src/components/auth/ProtectedRoute.tsx?t=1758546487915:179:35)
    at RenderedRoute (http://localhost:8080/node_modules/.vite/deps/react-router-dom.js?v=b7030666:4089:5)
    at Outlet (http://localhost:8080/node_modules/.vite/deps/react-router-dom.js?v=b7030666:4495:26)
    at div
    at main
    at div
    at Layout (http://localhost:8080/src/components/Layout.tsx?t=1758549303961:37:22)
    at RenderedRoute (http://localhost:8080/node_modules/.vite/deps/react-router-dom.js?v=b7030666:4089:5)
    at Routes (http://localhost:8080/node_modules/.vite/deps/react-router-dom.js?v=b7030666:4559:5)
    at ClientProvider (http://localhost:8080/src/context/ClientContext.tsx?t=1758546487915:27:34)
    at TaskProvider (http://localhost:8080/src/context/TaskContext.tsx?t=1758549272061:36:32)
    at ProjectProvider (http://localhost:8080/src/context/ProjectContext.tsx?t=1758549290295:41:35)
    at SessionContextProvider (http://localhost:8080/src/context/SessionContext.tsx?t=1758546487915:31:42)
    at Provider (http://localhost:8080/node_modules/.vite/deps/chunk-PSSEWZHR.js?v=b7030666:38:15)
    at TooltipProvider (http://localhost:8080/node_modules/.vite/deps/@radix-ui_react-tooltip.js?v=b7030666:65:5)
    at QueryClientProvider (http://localhost:8080/node_modules/.vite/deps/@tanstack_react-query.js?v=b7030666:2875:3)
    at ErrorBoundary (http://localhost:8080/src/components/ErrorBoundary/ErrorBoundary.tsx:272:5)
    at App
    at Router (http://localhost:8080/node_modules/.vite/deps/react-router-dom.js?v=b7030666:4502:15)
    at BrowserRouter (http://localhost:8080/node_modules/.vite/deps/react-router-dom.js?v=b7030666:5248:5)

React will try to recreate this component tree from scratch using the error boundary you provided, ErrorBoundary.
logCapturedError @ chunk-3VTW7PKX.js?v=b7030666:14080
callback @ chunk-3VTW7PKX.js?v=b7030666:14126
callCallback @ chunk-3VTW7PKX.js?v=b7030666:11296
commitUpdateQueue @ chunk-3VTW7PKX.js?v=b7030666:11313
commitLayoutEffectOnFiber @ chunk-3VTW7PKX.js?v=b7030666:17123
commitLayoutMountEffects_complete @ chunk-3VTW7PKX.js?v=b7030666:18030
commitLayoutEffects_begin @ chunk-3VTW7PKX.js?v=b7030666:18019
commitLayoutEffects @ chunk-3VTW7PKX.js?v=b7030666:17970
commitRootImpl @ chunk-3VTW7PKX.js?v=b7030666:19406
commitRoot @ chunk-3VTW7PKX.js?v=b7030666:19330
finishConcurrentRender @ chunk-3VTW7PKX.js?v=b7030666:18813
performConcurrentWorkOnRoot @ chunk-3VTW7PKX.js?v=b7030666:18768
workLoop @ chunk-3VTW7PKX.js?v=b7030666:197
flushWork @ chunk-3VTW7PKX.js?v=b7030666:176
performWorkUntilDeadline @ chunk-3VTW7PKX.js?v=b7030666:384
ErrorBoundary.tsx:29 Error caught by boundary: TypeError: Cannot read properties of undefined (reading 'filter')
    at ProjectCardComponent (ProjectCard.tsx:87:40)
    at renderWithHooks (chunk-3VTW7PKX.js?v=b7030666:11596:26)
    at updateFunctionComponent (chunk-3VTW7PKX.js?v=b7030666:14630:28)
    at updateSimpleMemoComponent (chunk-3VTW7PKX.js?v=b7030666:14511:18)
    at updateMemoComponent (chunk-3VTW7PKX.js?v=b7030666:14414:22)
    at beginWork (chunk-3VTW7PKX.js?v=b7030666:16025:22)
    at beginWork$1 (chunk-3VTW7PKX.js?v=b7030666:19806:22)
    at performUnitOfWork (chunk-3VTW7PKX.js?v=b7030666:19251:20)
    at workLoopSync (chunk-3VTW7PKX.js?v=b7030666:19190:13)
    at renderRootSync (chunk-3VTW7PKX.js?v=b7030666:19169:15) {componentStack: '\n    at ProjectCardComponent (http://localhost:808….vite/deps/react-router-dom.js?v=b7030666:5248:5)'}
componentDidCatch @ ErrorBoundary.tsx:29
callback @ chunk-3VTW7PKX.js?v=b7030666:14132
callCallback @ chunk-3VTW7PKX.js?v=b7030666:11296
commitUpdateQueue @ chunk-3VTW7PKX.js?v=b7030666:11313
commitLayoutEffectOnFiber @ chunk-3VTW7PKX.js?v=b7030666:17123
commitLayoutMountEffects_complete @ chunk-3VTW7PKX.js?v=b7030666:18030
commitLayoutEffects_begin @ chunk-3VTW7PKX.js?v=b7030666:18019
commitLayoutEffects @ chunk-3VTW7PKX.js?v=b7030666:17970
commitRootImpl @ chunk-3VTW7PKX.js?v=b7030666:19406
commitRoot @ chunk-3VTW7PKX.js?v=b7030666:19330
finishConcurrentRender @ chunk-3VTW7PKX.js?v=b7030666:18813
performConcurrentWorkOnRoot @ chunk-3VTW7PKX.js?v=b7030666:18768
workLoop @ chunk-3VTW7PKX.js?v=b7030666:197
flushWork @ chunk-3VTW7PKX.js?v=b7030666:176
performWorkUntilDeadline @ chunk-3VTW7PKX.js?v=b7030666:384
chunk-3VTW7PKX.js?v=b7030666:14080 The above error occurred in the <ProjectCardComponent> component:

    at ProjectCardComponent (http://localhost:8080/src/components/ProjectCard.tsx:88:33)
    at div
    at div
    at Projects (http://localhost:8080/src/pages/Projects.tsx?t=1758549290295:45:73)
    at Suspense
    at ErrorBoundary (http://localhost:8080/src/components/ErrorBoundary/ErrorBoundary.tsx:272:5)
    at PageErrorBoundary (http://localhost:8080/src/components/ErrorBoundary/ErrorBoundary.tsx:288:37)
    at LazyRoute (http://localhost:8080/src/App.tsx?t=1758549303961:82:22)
    at ProtectedRoute (http://localhost:8080/src/components/auth/ProtectedRoute.tsx?t=1758546487915:30:38)
    at RequireAuth (http://localhost:8080/src/components/auth/ProtectedRoute.tsx?t=1758546487915:179:35)
    at RenderedRoute (http://localhost:8080/node_modules/.vite/deps/react-router-dom.js?v=b7030666:4089:5)
    at Outlet (http://localhost:8080/node_modules/.vite/deps/react-router-dom.js?v=b7030666:4495:26)
    at div
    at main
    at div
    at Layout (http://localhost:8080/src/components/Layout.tsx?t=1758549303961:37:22)
    at RenderedRoute (http://localhost:8080/node_modules/.vite/deps/react-router-dom.js?v=b7030666:4089:5)
    at Routes (http://localhost:8080/node_modules/.vite/deps/react-router-dom.js?v=b7030666:4559:5)
    at ClientProvider (http://localhost:8080/src/context/ClientContext.tsx?t=1758546487915:27:34)
    at TaskProvider (http://localhost:8080/src/context/TaskContext.tsx?t=1758549272061:36:32)
    at ProjectProvider (http://localhost:8080/src/context/ProjectContext.tsx?t=1758549290295:41:35)
    at SessionContextProvider (http://localhost:8080/src/context/SessionContext.tsx?t=1758546487915:31:42)
    at Provider (http://localhost:8080/node_modules/.vite/deps/chunk-PSSEWZHR.js?v=b7030666:38:15)
    at TooltipProvider (http://localhost:8080/node_modules/.vite/deps/@radix-ui_react-tooltip.js?v=b7030666:65:5)
    at QueryClientProvider (http://localhost:8080/node_modules/.vite/deps/@tanstack_react-query.js?v=b7030666:2875:3)
    at ErrorBoundary (http://localhost:8080/src/components/ErrorBoundary/ErrorBoundary.tsx:272:5)
    at App
    at Router (http://localhost:8080/node_modules/.vite/deps/react-router-dom.js?v=b7030666:4502:15)
    at BrowserRouter (http://localhost:8080/node_modules/.vite/deps/react-router-dom.js?v=b7030666:5248:5)

React will try to recreate this component tree from scratch using the error boundary you provided, ErrorBoundary.
logCapturedError @ chunk-3VTW7PKX.js?v=b7030666:14080
callback @ chunk-3VTW7PKX.js?v=b7030666:14126
callCallback @ chunk-3VTW7PKX.js?v=b7030666:11296
commitUpdateQueue @ chunk-3VTW7PKX.js?v=b7030666:11313
commitLayoutEffectOnFiber @ chunk-3VTW7PKX.js?v=b7030666:17123
commitLayoutMountEffects_complete @ chunk-3VTW7PKX.js?v=b7030666:18030
commitLayoutEffects_begin @ chunk-3VTW7PKX.js?v=b7030666:18019
commitLayoutEffects @ chunk-3VTW7PKX.js?v=b7030666:17970
commitRootImpl @ chunk-3VTW7PKX.js?v=b7030666:19406
commitRoot @ chunk-3VTW7PKX.js?v=b7030666:19330
finishConcurrentRender @ chunk-3VTW7PKX.js?v=b7030666:18813
performConcurrentWorkOnRoot @ chunk-3VTW7PKX.js?v=b7030666:18768
workLoop @ chunk-3VTW7PKX.js?v=b7030666:197
flushWork @ chunk-3VTW7PKX.js?v=b7030666:176
performWorkUntilDeadline @ chunk-3VTW7PKX.js?v=b7030666:384
ErrorBoundary.tsx:29 Error caught by boundary: TypeError: Cannot read properties of undefined (reading 'filter')
    at ProjectCardComponent (ProjectCard.tsx:87:40)
    at renderWithHooks (chunk-3VTW7PKX.js?v=b7030666:11596:26)
    at updateFunctionComponent (chunk-3VTW7PKX.js?v=b7030666:14630:28)
    at updateSimpleMemoComponent (chunk-3VTW7PKX.js?v=b7030666:14511:18)
    at updateMemoComponent (chunk-3VTW7PKX.js?v=b7030666:14414:22)
    at beginWork (chunk-3VTW7PKX.js?v=b7030666:16025:22)
    at beginWork$1 (chunk-3VTW7PKX.js?v=b7030666:19806:22)
    at performUnitOfWork (chunk-3VTW7PKX.js?v=b7030666:19251:20)
    at workLoopSync (chunk-3VTW7PKX.js?v=b7030666:19190:13)
    at renderRootSync (chunk-3VTW7PKX.js?v=b7030666:19169:15) {componentStack: '\n    at ProjectCardComponent (http://localhost:808….vite/deps/react-router-dom.js?v=b7030666:5248:5)'}
componentDidCatch @ ErrorBoundary.tsx:29
callback @ chunk-3VTW7PKX.js?v=b7030666:14132
callCallback @ chunk-3VTW7PKX.js?v=b7030666:11296
commitUpdateQueue @ chunk-3VTW7PKX.js?v=b7030666:11313
commitLayoutEffectOnFiber @ chunk-3VTW7PKX.js?v=b7030666:17123
commitLayoutMountEffects_complete @ chunk-3VTW7PKX.js?v=b7030666:18030
commitLayoutEffects_begin @ chunk-3VTW7PKX.js?v=b7030666:18019
commitLayoutEffects @ chunk-3VTW7PKX.js?v=b7030666:17970
commitRootImpl @ chunk-3VTW7PKX.js?v=b7030666:19406
commitRoot @ chunk-3VTW7PKX.js?v=b7030666:19330
finishConcurrentRender @ chunk-3VTW7PKX.js?v=b7030666:18813
performConcurrentWorkOnRoot @ chunk-3VTW7PKX.js?v=b7030666:18768
workLoop @ chunk-3VTW7PKX.js?v=b7030666:197
flushWork @ chunk-3VTW7PKX.js?v=b7030666:176
performWorkUntilDeadline @ chunk-3VTW7PKX.js?v=b7030666:384
chunk-3VTW7PKX.js?v=b7030666:14080 The above error occurred in the <ProjectCardComponent> component:

    at ProjectCardComponent (http://localhost:8080/src/components/ProjectCard.tsx:88:33)
    at div
    at div
    at Projects (http://localhost:8080/src/pages/Projects.tsx?t=1758549290295:45:73)
    at Suspense
    at ErrorBoundary (http://localhost:8080/src/components/ErrorBoundary/ErrorBoundary.tsx:272:5)
    at PageErrorBoundary (http://localhost:8080/src/components/ErrorBoundary/ErrorBoundary.tsx:288:37)
    at LazyRoute (http://localhost:8080/src/App.tsx?t=1758549303961:82:22)
    at ProtectedRoute (http://localhost:8080/src/components/auth/ProtectedRoute.tsx?t=1758546487915:30:38)
    at RequireAuth (http://localhost:8080/src/components/auth/ProtectedRoute.tsx?t=1758546487915:179:35)
    at RenderedRoute (http://localhost:8080/node_modules/.vite/deps/react-router-dom.js?v=b7030666:4089:5)
    at Outlet (http://localhost:8080/node_modules/.vite/deps/react-router-dom.js?v=b7030666:4495:26)
    at div
    at main
    at div
    at Layout (http://localhost:8080/src/components/Layout.tsx?t=1758549303961:37:22)
    at RenderedRoute (http://localhost:8080/node_modules/.vite/deps/react-router-dom.js?v=b7030666:4089:5)
    at Routes (http://localhost:8080/node_modules/.vite/deps/react-router-dom.js?v=b7030666:4559:5)
    at ClientProvider (http://localhost:8080/src/context/ClientContext.tsx?t=1758546487915:27:34)
    at TaskProvider (http://localhost:8080/src/context/TaskContext.tsx?t=1758549272061:36:32)
    at ProjectProvider (http://localhost:8080/src/context/ProjectContext.tsx?t=1758549290295:41:35)
    at SessionContextProvider (http://localhost:8080/src/context/SessionContext.tsx?t=1758546487915:31:42)
    at Provider (http://localhost:8080/node_modules/.vite/deps/chunk-PSSEWZHR.js?v=b7030666:38:15)
    at TooltipProvider (http://localhost:8080/node_modules/.vite/deps/@radix-ui_react-tooltip.js?v=b7030666:65:5)
    at QueryClientProvider (http://localhost:8080/node_modules/.vite/deps/@tanstack_react-query.js?v=b7030666:2875:3)
    at ErrorBoundary (http://localhost:8080/src/components/ErrorBoundary/ErrorBoundary.tsx:272:5)
    at App
    at Router (http://localhost:8080/node_modules/.vite/deps/react-router-dom.js?v=b7030666:4502:15)
    at BrowserRouter (http://localhost:8080/node_modules/.vite/deps/react-router-dom.js?v=b7030666:5248:5)

React will try to recreate this component tree from scratch using the error boundary you provided, ErrorBoundary.
logCapturedError @ chunk-3VTW7PKX.js?v=b7030666:14080
callback @ chunk-3VTW7PKX.js?v=b7030666:14126
callCallback @ chunk-3VTW7PKX.js?v=b7030666:11296
commitUpdateQueue @ chunk-3VTW7PKX.js?v=b7030666:11313
commitLayoutEffectOnFiber @ chunk-3VTW7PKX.js?v=b7030666:17123
commitLayoutMountEffects_complete @ chunk-3VTW7PKX.js?v=b7030666:18030
commitLayoutEffects_begin @ chunk-3VTW7PKX.js?v=b7030666:18019
commitLayoutEffects @ chunk-3VTW7PKX.js?v=b7030666:17970
commitRootImpl @ chunk-3VTW7PKX.js?v=b7030666:19406
commitRoot @ chunk-3VTW7PKX.js?v=b7030666:19330
finishConcurrentRender @ chunk-3VTW7PKX.js?v=b7030666:18813
performConcurrentWorkOnRoot @ chunk-3VTW7PKX.js?v=b7030666:18768
workLoop @ chunk-3VTW7PKX.js?v=b7030666:197
flushWork @ chunk-3VTW7PKX.js?v=b7030666:176
performWorkUntilDeadline @ chunk-3VTW7PKX.js?v=b7030666:384
ErrorBoundary.tsx:29 Error caught by boundary: TypeError: Cannot read properties of undefined (reading 'filter')
    at ProjectCardComponent (ProjectCard.tsx:87:40)
    at renderWithHooks (chunk-3VTW7PKX.js?v=b7030666:11596:26)
    at updateFunctionComponent (chunk-3VTW7PKX.js?v=b7030666:14630:28)
    at updateSimpleMemoComponent (chunk-3VTW7PKX.js?v=b7030666:14511:18)
    at updateMemoComponent (chunk-3VTW7PKX.js?v=b7030666:14414:22)
    at beginWork (chunk-3VTW7PKX.js?v=b7030666:16025:22)
    at beginWork$1 (chunk-3VTW7PKX.js?v=b7030666:19806:22)
    at performUnitOfWork (chunk-3VTW7PKX.js?v=b7030666:19251:20)
    at workLoopSync (chunk-3VTW7PKX.js?v=b7030666:19190:13)
    at renderRootSync (chunk-3VTW7PKX.js?v=b7030666:19169:15) {componentStack: '\n    at ProjectCardComponent (http://localhost:808….vite/deps/react-router-dom.js?v=b7030666:5248:5)'}
componentDidCatch @ ErrorBoundary.tsx:29
callback @ chunk-3VTW7PKX.js?v=b7030666:14132
callCallback @ chunk-3VTW7PKX.js?v=b7030666:11296
commitUpdateQueue @ chunk-3VTW7PKX.js?v=b7030666:11313
commitLayoutEffectOnFiber @ chunk-3VTW7PKX.js?v=b7030666:17123
commitLayoutMountEffects_complete @ chunk-3VTW7PKX.js?v=b7030666:18030
commitLayoutEffects_begin @ chunk-3VTW7PKX.js?v=b7030666:18019
commitLayoutEffects @ chunk-3VTW7PKX.js?v=b7030666:17970
commitRootImpl @ chunk-3VTW7PKX.js?v=b7030666:19406
commitRoot @ chunk-3VTW7PKX.js?v=b7030666:19330
finishConcurrentRender @ chunk-3VTW7PKX.js?v=b7030666:18813
performConcurrentWorkOnRoot @ chunk-3VTW7PKX.js?v=b7030666:18768
workLoop @ chunk-3VTW7PKX.js?v=b7030666:197
flushWork @ chunk-3VTW7PKX.js?v=b7030666:176
performWorkUntilDeadline @ chunk-3VTW7PKX.js?v=b7030666:384
chunk-3VTW7PKX.js?v=b7030666:14080 The above error occurred in the <ProjectCardComponent> component:

    at ProjectCardComponent (http://localhost:8080/src/components/ProjectCard.tsx:88:33)
    at div
    at div
    at Projects (http://localhost:8080/src/pages/Projects.tsx?t=1758549290295:45:73)
    at Suspense
    at ErrorBoundary (http://localhost:8080/src/components/ErrorBoundary/ErrorBoundary.tsx:272:5)
    at PageErrorBoundary (http://localhost:8080/src/components/ErrorBoundary/ErrorBoundary.tsx:288:37)
    at LazyRoute (http://localhost:8080/src/App.tsx?t=1758549303961:82:22)
    at ProtectedRoute (http://localhost:8080/src/components/auth/ProtectedRoute.tsx?t=1758546487915:30:38)
    at RequireAuth (http://localhost:8080/src/components/auth/ProtectedRoute.tsx?t=1758546487915:179:35)
    at RenderedRoute (http://localhost:8080/node_modules/.vite/deps/react-router-dom.js?v=b7030666:4089:5)
    at Outlet (http://localhost:8080/node_modules/.vite/deps/react-router-dom.js?v=b7030666:4495:26)
    at div
    at main
    at div
    at Layout (http://localhost:8080/src/components/Layout.tsx?t=1758549303961:37:22)
    at RenderedRoute (http://localhost:8080/node_modules/.vite/deps/react-router-dom.js?v=b7030666:4089:5)
    at Routes (http://localhost:8080/node_modules/.vite/deps/react-router-dom.js?v=b7030666:4559:5)
    at ClientProvider (http://localhost:8080/src/context/ClientContext.tsx?t=1758546487915:27:34)
    at TaskProvider (http://localhost:8080/src/context/TaskContext.tsx?t=1758549272061:36:32)
    at ProjectProvider (http://localhost:8080/src/context/ProjectContext.tsx?t=1758549290295:41:35)
    at SessionContextProvider (http://localhost:8080/src/context/SessionContext.tsx?t=1758546487915:31:42)
    at Provider (http://localhost:8080/node_modules/.vite/deps/chunk-PSSEWZHR.js?v=b7030666:38:15)
    at TooltipProvider (http://localhost:8080/node_modules/.vite/deps/@radix-ui_react-tooltip.js?v=b7030666:65:5)
    at QueryClientProvider (http://localhost:8080/node_modules/.vite/deps/@tanstack_react-query.js?v=b7030666:2875:3)
    at ErrorBoundary (http://localhost:8080/src/components/ErrorBoundary/ErrorBoundary.tsx:272:5)
    at App
    at Router (http://localhost:8080/node_modules/.vite/deps/react-router-dom.js?v=b7030666:4502:15)
    at BrowserRouter (http://localhost:8080/node_modules/.vite/deps/react-router-dom.js?v=b7030666:5248:5)

React will try to recreate this component tree from scratch using the error boundary you provided, ErrorBoundary.
logCapturedError @ chunk-3VTW7PKX.js?v=b7030666:14080
callback @ chunk-3VTW7PKX.js?v=b7030666:14126
callCallback @ chunk-3VTW7PKX.js?v=b7030666:11296
commitUpdateQueue @ chunk-3VTW7PKX.js?v=b7030666:11313
commitLayoutEffectOnFiber @ chunk-3VTW7PKX.js?v=b7030666:17123
commitLayoutMountEffects_complete @ chunk-3VTW7PKX.js?v=b7030666:18030
commitLayoutEffects_begin @ chunk-3VTW7PKX.js?v=b7030666:18019
commitLayoutEffects @ chunk-3VTW7PKX.js?v=b7030666:17970
commitRootImpl @ chunk-3VTW7PKX.js?v=b7030666:19406
commitRoot @ chunk-3VTW7PKX.js?v=b7030666:19330
finishConcurrentRender @ chunk-3VTW7PKX.js?v=b7030666:18813
performConcurrentWorkOnRoot @ chunk-3VTW7PKX.js?v=b7030666:18768
workLoop @ chunk-3VTW7PKX.js?v=b7030666:197
flushWork @ chunk-3VTW7PKX.js?v=b7030666:176
performWorkUntilDeadline @ chunk-3VTW7PKX.js?v=b7030666:384
ErrorBoundary.tsx:29 Error caught by boundary: TypeError: Cannot read properties of undefined (reading 'filter')
    at ProjectCardComponent (ProjectCard.tsx:87:40)
    at renderWithHooks (chunk-3VTW7PKX.js?v=b7030666:11596:26)
    at updateFunctionComponent (chunk-3VTW7PKX.js?v=b7030666:14630:28)
    at updateSimpleMemoComponent (chunk-3VTW7PKX.js?v=b7030666:14511:18)
    at updateMemoComponent (chunk-3VTW7PKX.js?v=b7030666:14414:22)
    at beginWork (chunk-3VTW7PKX.js?v=b7030666:16025:22)
    at beginWork$1 (chunk-3VTW7PKX.js?v=b7030666:19806:22)
    at performUnitOfWork (chunk-3VTW7PKX.js?v=b7030666:19251:20)
    at workLoopSync (chunk-3VTW7PKX.js?v=b7030666:19190:13)
    at renderRootSync (chunk-3VTW7PKX.js?v=b7030666:19169:15) {componentStack: '\n    at ProjectCardComponent (http://localhost:808….vite/deps/react-router-dom.js?v=b7030666:5248:5)'}
componentDidCatch @ ErrorBoundary.tsx:29
callback @ chunk-3VTW7PKX.js?v=b7030666:14132
callCallback @ chunk-3VTW7PKX.js?v=b7030666:11296
commitUpdateQueue @ chunk-3VTW7PKX.js?v=b7030666:11313
commitLayoutEffectOnFiber @ chunk-3VTW7PKX.js?v=b7030666:17123
commitLayoutMountEffects_complete @ chunk-3VTW7PKX.js?v=b7030666:18030
commitLayoutEffects_begin @ chunk-3VTW7PKX.js?v=b7030666:18019
commitLayoutEffects @ chunk-3VTW7PKX.js?v=b7030666:17970
commitRootImpl @ chunk-3VTW7PKX.js?v=b7030666:19406
commitRoot @ chunk-3VTW7PKX.js?v=b7030666:19330
finishConcurrentRender @ chunk-3VTW7PKX.js?v=b7030666:18813
performConcurrentWorkOnRoot @ chunk-3VTW7PKX.js?v=b7030666:18768
workLoop @ chunk-3VTW7PKX.js?v=b7030666:197
flushWork @ chunk-3VTW7PKX.js?v=b7030666:176
performWorkUntilDeadline @ chunk-3VTW7PKX.js?v=b7030666:384
chunk-3VTW7PKX.js?v=b7030666:14080 The above error occurred in the <ProjectCardComponent> component:

    at ProjectCardComponent (http://localhost:8080/src/components/ProjectCard.tsx:88:33)
    at div
    at div
    at Projects (http://localhost:8080/src/pages/Projects.tsx?t=1758549290295:45:73)
    at Suspense
    at ErrorBoundary (http://localhost:8080/src/components/ErrorBoundary/ErrorBoundary.tsx:272:5)
    at PageErrorBoundary (http://localhost:8080/src/components/ErrorBoundary/ErrorBoundary.tsx:288:37)
    at LazyRoute (http://localhost:8080/src/App.tsx?t=1758549303961:82:22)
    at ProtectedRoute (http://localhost:8080/src/components/auth/ProtectedRoute.tsx?t=1758546487915:30:38)
    at RequireAuth (http://localhost:8080/src/components/auth/ProtectedRoute.tsx?t=1758546487915:179:35)
    at RenderedRoute (http://localhost:8080/node_modules/.vite/deps/react-router-dom.js?v=b7030666:4089:5)
    at Outlet (http://localhost:8080/node_modules/.vite/deps/react-router-dom.js?v=b7030666:4495:26)
    at div
    at main
    at div
    at Layout (http://localhost:8080/src/components/Layout.tsx?t=1758549303961:37:22)
    at RenderedRoute (http://localhost:8080/node_modules/.vite/deps/react-router-dom.js?v=b7030666:4089:5)
    at Routes (http://localhost:8080/node_modules/.vite/deps/react-router-dom.js?v=b7030666:4559:5)
    at ClientProvider (http://localhost:8080/src/context/ClientContext.tsx?t=1758546487915:27:34)
    at TaskProvider (http://localhost:8080/src/context/TaskContext.tsx?t=1758549272061:36:32)
    at ProjectProvider (http://localhost:8080/src/context/ProjectContext.tsx?t=1758549290295:41:35)
    at SessionContextProvider (http://localhost:8080/src/context/SessionContext.tsx?t=1758546487915:31:42)
    at Provider (http://localhost:8080/node_modules/.vite/deps/chunk-PSSEWZHR.js?v=b7030666:38:15)
    at TooltipProvider (http://localhost:8080/node_modules/.vite/deps/@radix-ui_react-tooltip.js?v=b7030666:65:5)
    at QueryClientProvider (http://localhost:8080/node_modules/.vite/deps/@tanstack_react-query.js?v=b7030666:2875:3)
    at ErrorBoundary (http://localhost:8080/src/components/ErrorBoundary/ErrorBoundary.tsx:272:5)
    at App
    at Router (http://localhost:8080/node_modules/.vite/deps/react-router-dom.js?v=b7030666:4502:15)
    at BrowserRouter (http://localhost:8080/node_modules/.vite/deps/react-router-dom.js?v=b7030666:5248:5)

React will try to recreate this component tree from scratch using the error boundary you provided, ErrorBoundary.
logCapturedError @ chunk-3VTW7PKX.js?v=b7030666:14080
callback @ chunk-3VTW7PKX.js?v=b7030666:14126
callCallback @ chunk-3VTW7PKX.js?v=b7030666:11296
commitUpdateQueue @ chunk-3VTW7PKX.js?v=b7030666:11313
commitLayoutEffectOnFiber @ chunk-3VTW7PKX.js?v=b7030666:17123
commitLayoutMountEffects_complete @ chunk-3VTW7PKX.js?v=b7030666:18030
commitLayoutEffects_begin @ chunk-3VTW7PKX.js?v=b7030666:18019
commitLayoutEffects @ chunk-3VTW7PKX.js?v=b7030666:17970
commitRootImpl @ chunk-3VTW7PKX.js?v=b7030666:19406
commitRoot @ chunk-3VTW7PKX.js?v=b7030666:19330
finishConcurrentRender @ chunk-3VTW7PKX.js?v=b7030666:18813
performConcurrentWorkOnRoot @ chunk-3VTW7PKX.js?v=b7030666:18768
workLoop @ chunk-3VTW7PKX.js?v=b7030666:197
flushWork @ chunk-3VTW7PKX.js?v=b7030666:176
performWorkUntilDeadline @ chunk-3VTW7PKX.js?v=b7030666:384
ErrorBoundary.tsx:29 Error caught by boundary: TypeError: Cannot read properties of undefined (reading 'filter')
    at ProjectCardComponent (ProjectCard.tsx:87:40)
    at renderWithHooks (chunk-3VTW7PKX.js?v=b7030666:11596:26)
    at updateFunctionComponent (chunk-3VTW7PKX.js?v=b7030666:14630:28)
    at updateSimpleMemoComponent (chunk-3VTW7PKX.js?v=b7030666:14511:18)
    at updateMemoComponent (chunk-3VTW7PKX.js?v=b7030666:14414:22)
    at beginWork (chunk-3VTW7PKX.js?v=b7030666:16025:22)
    at beginWork$1 (chunk-3VTW7PKX.js?v=b7030666:19806:22)
    at performUnitOfWork (chunk-3VTW7PKX.js?v=b7030666:19251:20)
    at workLoopSync (chunk-3VTW7PKX.js?v=b7030666:19190:13)
    at renderRootSync (chunk-3VTW7PKX.js?v=b7030666:19169:15) {componentStack: '\n    at ProjectCardComponent (http://localhost:808….vite/deps/react-router-dom.js?v=b7030666:5248:5)'}
componentDidCatch @ ErrorBoundary.tsx:29
callback @ chunk-3VTW7PKX.js?v=b7030666:14132
callCallback @ chunk-3VTW7PKX.js?v=b7030666:11296
commitUpdateQueue @ chunk-3VTW7PKX.js?v=b7030666:11313
commitLayoutEffectOnFiber @ chunk-3VTW7PKX.js?v=b7030666:17123
commitLayoutMountEffects_complete @ chunk-3VTW7PKX.js?v=b7030666:18030
commitLayoutEffects_begin @ chunk-3VTW7PKX.js?v=b7030666:18019
commitLayoutEffects @ chunk-3VTW7PKX.js?v=b7030666:17970
commitRootImpl @ chunk-3VTW7PKX.js?v=b7030666:19406
commitRoot @ chunk-3VTW7PKX.js?v=b7030666:19330
finishConcurrentRender @ chunk-3VTW7PKX.js?v=b7030666:18813
performConcurrentWorkOnRoot @ chunk-3VTW7PKX.js?v=b7030666:18768
workLoop @ chunk-3VTW7PKX.js?v=b7030666:197
flushWork @ chunk-3VTW7PKX.js?v=b7030666:176
performWorkUntilDeadline @ chunk-3VTW7PKX.js?v=b7030666:384
chunk-3VTW7PKX.js?v=b7030666:14080 The above error occurred in the <ProjectCardComponent> component:

    at ProjectCardComponent (http://localhost:8080/src/components/ProjectCard.tsx:88:33)
    at div
    at div
    at Projects (http://localhost:8080/src/pages/Projects.tsx?t=1758549290295:45:73)
    at Suspense
    at ErrorBoundary (http://localhost:8080/src/components/ErrorBoundary/ErrorBoundary.tsx:272:5)
    at PageErrorBoundary (http://localhost:8080/src/components/ErrorBoundary/ErrorBoundary.tsx:288:37)
    at LazyRoute (http://localhost:8080/src/App.tsx?t=1758549303961:82:22)
    at ProtectedRoute (http://localhost:8080/src/components/auth/ProtectedRoute.tsx?t=1758546487915:30:38)
    at RequireAuth (http://localhost:8080/src/components/auth/ProtectedRoute.tsx?t=1758546487915:179:35)
    at RenderedRoute (http://localhost:8080/node_modules/.vite/deps/react-router-dom.js?v=b7030666:4089:5)
    at Outlet (http://localhost:8080/node_modules/.vite/deps/react-router-dom.js?v=b7030666:4495:26)
    at div
    at main
    at div
    at Layout (http://localhost:8080/src/components/Layout.tsx?t=1758549303961:37:22)
    at RenderedRoute (http://localhost:8080/node_modules/.vite/deps/react-router-dom.js?v=b7030666:4089:5)
    at Routes (http://localhost:8080/node_modules/.vite/deps/react-router-dom.js?v=b7030666:4559:5)
    at ClientProvider (http://localhost:8080/src/context/ClientContext.tsx?t=1758546487915:27:34)
    at TaskProvider (http://localhost:8080/src/context/TaskContext.tsx?t=1758549272061:36:32)
    at ProjectProvider (http://localhost:8080/src/context/ProjectContext.tsx?t=1758549290295:41:35)
    at SessionContextProvider (http://localhost:8080/src/context/SessionContext.tsx?t=1758546487915:31:42)
    at Provider (http://localhost:8080/node_modules/.vite/deps/chunk-PSSEWZHR.js?v=b7030666:38:15)
    at TooltipProvider (http://localhost:8080/node_modules/.vite/deps/@radix-ui_react-tooltip.js?v=b7030666:65:5)
    at QueryClientProvider (http://localhost:8080/node_modules/.vite/deps/@tanstack_react-query.js?v=b7030666:2875:3)
    at ErrorBoundary (http://localhost:8080/src/components/ErrorBoundary/ErrorBoundary.tsx:272:5)
    at App
    at Router (http://localhost:8080/node_modules/.vite/deps/react-router-dom.js?v=b7030666:4502:15)
    at BrowserRouter (http://localhost:8080/node_modules/.vite/deps/react-router-dom.js?v=b7030666:5248:5)

React will try to recreate this component tree from scratch using the error boundary you provided, ErrorBoundary.
logCapturedError @ chunk-3VTW7PKX.js?v=b7030666:14080
callback @ chunk-3VTW7PKX.js?v=b7030666:14126
callCallback @ chunk-3VTW7PKX.js?v=b7030666:11296
commitUpdateQueue @ chunk-3VTW7PKX.js?v=b7030666:11313
commitLayoutEffectOnFiber @ chunk-3VTW7PKX.js?v=b7030666:17123
commitLayoutMountEffects_complete @ chunk-3VTW7PKX.js?v=b7030666:18030
commitLayoutEffects_begin @ chunk-3VTW7PKX.js?v=b7030666:18019
commitLayoutEffects @ chunk-3VTW7PKX.js?v=b7030666:17970
commitRootImpl @ chunk-3VTW7PKX.js?v=b7030666:19406
commitRoot @ chunk-3VTW7PKX.js?v=b7030666:19330
finishConcurrentRender @ chunk-3VTW7PKX.js?v=b7030666:18813
performConcurrentWorkOnRoot @ chunk-3VTW7PKX.js?v=b7030666:18768
workLoop @ chunk-3VTW7PKX.js?v=b7030666:197
flushWork @ chunk-3VTW7PKX.js?v=b7030666:176
performWorkUntilDeadline @ chunk-3VTW7PKX.js?v=b7030666:384
ErrorBoundary.tsx:29 Error caught by boundary: TypeError: Cannot read properties of undefined (reading 'filter')
    at ProjectCardComponent (ProjectCard.tsx:87:40)
    at renderWithHooks (chunk-3VTW7PKX.js?v=b7030666:11596:26)
    at updateFunctionComponent (chunk-3VTW7PKX.js?v=b7030666:14630:28)
    at updateSimpleMemoComponent (chunk-3VTW7PKX.js?v=b7030666:14511:18)
    at updateMemoComponent (chunk-3VTW7PKX.js?v=b7030666:14414:22)
    at beginWork (chunk-3VTW7PKX.js?v=b7030666:16025:22)
    at beginWork$1 (chunk-3VTW7PKX.js?v=b7030666:19806:22)
    at performUnitOfWork (chunk-3VTW7PKX.js?v=b7030666:19251:20)
    at workLoopSync (chunk-3VTW7PKX.js?v=b7030666:19190:13)
    at renderRootSync (chunk-3VTW7PKX.js?v=b7030666:19169:15) {componentStack: '\n    at ProjectCardComponent (http://localhost:808….vite/deps/react-router-dom.js?v=b7030666:5248:5)'}
componentDidCatch @ ErrorBoundary.tsx:29
callback @ chunk-3VTW7PKX.js?v=b7030666:14132
callCallback @ chunk-3VTW7PKX.js?v=b7030666:11296
commitUpdateQueue @ chunk-3VTW7PKX.js?v=b7030666:11313
commitLayoutEffectOnFiber @ chunk-3VTW7PKX.js?v=b7030666:17123
commitLayoutMountEffects_complete @ chunk-3VTW7PKX.js?v=b7030666:18030
commitLayoutEffects_begin @ chunk-3VTW7PKX.js?v=b7030666:18019
commitLayoutEffects @ chunk-3VTW7PKX.js?v=b7030666:17970
commitRootImpl @ chunk-3VTW7PKX.js?v=b7030666:19406
commitRoot @ chunk-3VTW7PKX.js?v=b7030666:19330
finishConcurrentRender @ chunk-3VTW7PKX.js?v=b7030666:18813
performConcurrentWorkOnRoot @ chunk-3VTW7PKX.js?v=b7030666:18768
workLoop @ chunk-3VTW7PKX.js?v=b7030666:197
flushWork @ chunk-3VTW7PKX.js?v=b7030666:176
performWorkUntilDeadline @ chunk-3VTW7PKX.js?v=b7030666:384
chunk-3VTW7PKX.js?v=b7030666:14080 The above error occurred in the <ProjectCardComponent> component:

    at ProjectCardComponent (http://localhost:8080/src/components/ProjectCard.tsx:88:33)
    at div
    at div
    at Projects (http://localhost:8080/src/pages/Projects.tsx?t=1758549290295:45:73)
    at Suspense
    at ErrorBoundary (http://localhost:8080/src/components/ErrorBoundary/ErrorBoundary.tsx:272:5)
    at PageErrorBoundary (http://localhost:8080/src/components/ErrorBoundary/ErrorBoundary.tsx:288:37)
    at LazyRoute (http://localhost:8080/src/App.tsx?t=1758549303961:82:22)
    at ProtectedRoute (http://localhost:8080/src/components/auth/ProtectedRoute.tsx?t=1758546487915:30:38)
    at RequireAuth (http://localhost:8080/src/components/auth/ProtectedRoute.tsx?t=1758546487915:179:35)
    at RenderedRoute (http://localhost:8080/node_modules/.vite/deps/react-router-dom.js?v=b7030666:4089:5)
    at Outlet (http://localhost:8080/node_modules/.vite/deps/react-router-dom.js?v=b7030666:4495:26)
    at div
    at main
    at div
    at Layout (http://localhost:8080/src/components/Layout.tsx?t=1758549303961:37:22)
    at RenderedRoute (http://localhost:8080/node_modules/.vite/deps/react-router-dom.js?v=b7030666:4089:5)
    at Routes (http://localhost:8080/node_modules/.vite/deps/react-router-dom.js?v=b7030666:4559:5)
    at ClientProvider (http://localhost:8080/src/context/ClientContext.tsx?t=1758546487915:27:34)
    at TaskProvider (http://localhost:8080/src/context/TaskContext.tsx?t=1758549272061:36:32)
    at ProjectProvider (http://localhost:8080/src/context/ProjectContext.tsx?t=1758549290295:41:35)
    at SessionContextProvider (http://localhost:8080/src/context/SessionContext.tsx?t=1758546487915:31:42)
    at Provider (http://localhost:8080/node_modules/.vite/deps/chunk-PSSEWZHR.js?v=b7030666:38:15)
    at TooltipProvider (http://localhost:8080/node_modules/.vite/deps/@radix-ui_react-tooltip.js?v=b7030666:65:5)
    at QueryClientProvider (http://localhost:8080/node_modules/.vite/deps/@tanstack_react-query.js?v=b7030666:2875:3)
    at ErrorBoundary (http://localhost:8080/src/components/ErrorBoundary/ErrorBoundary.tsx:272:5)
    at App
    at Router (http://localhost:8080/node_modules/.vite/deps/react-router-dom.js?v=b7030666:4502:15)
    at BrowserRouter (http://localhost:8080/node_modules/.vite/deps/react-router-dom.js?v=b7030666:5248:5)

React will try to recreate this component tree from scratch using the error boundary you provided, ErrorBoundary.
logCapturedError @ chunk-3VTW7PKX.js?v=b7030666:14080
callback @ chunk-3VTW7PKX.js?v=b7030666:14126
callCallback @ chunk-3VTW7PKX.js?v=b7030666:11296
commitUpdateQueue @ chunk-3VTW7PKX.js?v=b7030666:11313
commitLayoutEffectOnFiber @ chunk-3VTW7PKX.js?v=b7030666:17123
commitLayoutMountEffects_complete @ chunk-3VTW7PKX.js?v=b7030666:18030
commitLayoutEffects_begin @ chunk-3VTW7PKX.js?v=b7030666:18019
commitLayoutEffects @ chunk-3VTW7PKX.js?v=b7030666:17970
commitRootImpl @ chunk-3VTW7PKX.js?v=b7030666:19406
commitRoot @ chunk-3VTW7PKX.js?v=b7030666:19330
finishConcurrentRender @ chunk-3VTW7PKX.js?v=b7030666:18813
performConcurrentWorkOnRoot @ chunk-3VTW7PKX.js?v=b7030666:18768
workLoop @ chunk-3VTW7PKX.js?v=b7030666:197
flushWork @ chunk-3VTW7PKX.js?v=b7030666:176
performWorkUntilDeadline @ chunk-3VTW7PKX.js?v=b7030666:384
ErrorBoundary.tsx:29 Error caught by boundary: TypeError: Cannot read properties of undefined (reading 'filter')
    at ProjectCardComponent (ProjectCard.tsx:87:40)
    at renderWithHooks (chunk-3VTW7PKX.js?v=b7030666:11596:26)
    at updateFunctionComponent (chunk-3VTW7PKX.js?v=b7030666:14630:28)
    at updateSimpleMemoComponent (chunk-3VTW7PKX.js?v=b7030666:14511:18)
    at updateMemoComponent (chunk-3VTW7PKX.js?v=b7030666:14414:22)
    at beginWork (chunk-3VTW7PKX.js?v=b7030666:16025:22)
    at beginWork$1 (chunk-3VTW7PKX.js?v=b7030666:19806:22)
    at performUnitOfWork (chunk-3VTW7PKX.js?v=b7030666:19251:20)
    at workLoopSync (chunk-3VTW7PKX.js?v=b7030666:19190:13)
    at renderRootSync (chunk-3VTW7PKX.js?v=b7030666:19169:15) {componentStack: '\n    at ProjectCardComponent (http://localhost:808….vite/deps/react-router-dom.js?v=b7030666:5248:5)'}
componentDidCatch @ ErrorBoundary.tsx:29
callback @ chunk-3VTW7PKX.js?v=b7030666:14132
callCallback @ chunk-3VTW7PKX.js?v=b7030666:11296
commitUpdateQueue @ chunk-3VTW7PKX.js?v=b7030666:11313
commitLayoutEffectOnFiber @ chunk-3VTW7PKX.js?v=b7030666:17123
commitLayoutMountEffects_complete @ chunk-3VTW7PKX.js?v=b7030666:18030
commitLayoutEffects_begin @ chunk-3VTW7PKX.js?v=b7030666:18019
commitLayoutEffects @ chunk-3VTW7PKX.js?v=b7030666:17970
commitRootImpl @ chunk-3VTW7PKX.js?v=b7030666:19406
commitRoot @ chunk-3VTW7PKX.js?v=b7030666:19330
finishConcurrentRender @ chunk-3VTW7PKX.js?v=b7030666:18813
performConcurrentWorkOnRoot @ chunk-3VTW7PKX.js?v=b7030666:18768
workLoop @ chunk-3VTW7PKX.js?v=b7030666:197
flushWork @ chunk-3VTW7PKX.js?v=b7030666:176
performWorkUntilDeadline @ chunk-3VTW7PKX.js?v=b7030666:384
validation-schemas.ts:107 Validation failed in ProfileQueryResult casting, using fallback: ZodError: [
  {
    "code": "invalid_type",
    "expected": "string",
    "received": "null",
    "path": [
      "data",
      "first_name"
    ],
    "message": "Expected string, received null"
  },
  {
    "code": "invalid_type",
    "expected": "string",
    "received": "null",
    "path": [
      "data",
      "last_name"
    ],
    "message": "Expected string, received null"
  },
  {
    "code": "invalid_type",
    "expected": "string",
    "received": "null",
    "path": [
      "data",
      "avatar_url"
    ],
    "message": "Expected string, received null"
  }
]
    at get error (zod.js?v=b7030666:512:23)
    at ZodNullable.parse (zod.js?v=b7030666:588:18)
    at safeValidateData (validation-schemas.ts:105:19)
    at safeCastToProfileResult (validation-schemas.ts:145:10)
    at enhanceUser (SessionContext.tsx:85:31)
    at async initializeSession (SessionContext.tsx:224:32)
safeValidateData @ validation-schemas.ts:107
safeCastToProfileResult @ validation-schemas.ts:145
enhanceUser @ SessionContext.tsx:85
await in enhanceUser
initializeSession @ SessionContext.tsx:224
await in initializeSession
(anonymous) @ SessionContext.tsx:255
commitHookEffectListMount @ chunk-3VTW7PKX.js?v=b7030666:16963
commitPassiveMountOnFiber @ chunk-3VTW7PKX.js?v=b7030666:18206
commitPassiveMountEffects_complete @ chunk-3VTW7PKX.js?v=b7030666:18179
commitPassiveMountEffects_begin @ chunk-3VTW7PKX.js?v=b7030666:18169
commitPassiveMountEffects @ chunk-3VTW7PKX.js?v=b7030666:18159
flushPassiveEffectsImpl @ chunk-3VTW7PKX.js?v=b7030666:19543
flushPassiveEffects @ chunk-3VTW7PKX.js?v=b7030666:19500
commitRootImpl @ chunk-3VTW7PKX.js?v=b7030666:19469
commitRoot @ chunk-3VTW7PKX.js?v=b7030666:19330
performSyncWorkOnRoot @ chunk-3VTW7PKX.js?v=b7030666:18948
flushSyncCallbacks @ chunk-3VTW7PKX.js?v=b7030666:9166
(anonymous) @ chunk-3VTW7PKX.js?v=b7030666:18677
logger.ts:97 [ProjectContext] Loaded 16 active projects, 1 archived undefined
api-protection.ts:74  GET https://nktdqpzxzouxcsvmijvt.supabase.co/rest/v1/tasks?select=*%2Cprojects%21inner%28id%2Cname%2Cuser_id%29&projects.user_id=eq.59e49b27-57ec-4a29-919d-21e856ed6ed0 404 (Not Found)
protectedFetch @ api-protection.ts:74
(anonymous) @ @supabase_supabase-js.js?v=b7030666:4296
(anonymous) @ @supabase_supabase-js.js?v=b7030666:4317
fulfilled @ @supabase_supabase-js.js?v=b7030666:4269
Promise.then
step @ @supabase_supabase-js.js?v=b7030666:4282
(anonymous) @ @supabase_supabase-js.js?v=b7030666:4284
__awaiter6 @ @supabase_supabase-js.js?v=b7030666:4266
(anonymous) @ @supabase_supabase-js.js?v=b7030666:4307
then @ @supabase_supabase-js.js?v=b7030666:90
