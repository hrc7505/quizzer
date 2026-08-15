# TaxonomyManager.tsx — Inline Style Catalog

Total inline styles: 169

---

## 1. Exams View — DataGrid & Columns (Styles #1–11)

### Style #1 — Line 551
**Element:** Exam title Button (transparent, in examColumns)
```tsx
style={{ padding: 0, height: 'auto', fontWeight: 'bold', color: '#0078d4', textAlign: 'left', justifyContent: 'flex-start', minWidth: 'auto' }}
```

### Style #2 — Line 571
**Element:** Text (exam description cell)
```tsx
style={{ color: '#616161', fontSize: '13px' }}
```

### Style #3 — Line 572
**Element:** span (exam description fallback "No description")
```tsx
style={{ fontStyle: 'italic', color: '#b3b3b3' }}
```

### Style #4 — Line 586
**Element:** div (exam topics count container)
```tsx
style={{ display: 'flex', alignItems: 'center', gap: '6px' }}
```

### Style #5 — Line 587
**Element:** BookOpen24Regular icon
```tsx
style={{ color: '#0078d4' }}
```

### Style #6 — Line 630
**Element:** Topic title Button (transparent, in topicColumns)
```tsx
style={{ padding: 0, height: 'auto', fontWeight: 'semibold', color: '#0078d4', textAlign: 'left', justifyContent: 'flex-start', minWidth: 'auto' }}
```

### Style #7 — Line 650
**Element:** div (topic display type container)
```tsx
style={{ display: 'flex', alignItems: 'center', gap: '4px' }}
```

### Style #8 — Line 651
**Element:** ChevronRight20Regular icon
```tsx
style={{ color: '#a19f9d' }}
```

### Style #9 — Line 652
**Element:** Text (topic display type text)
```tsx
style={{ fontSize: '13px', color: '#616161' }}
```

### Style #10 — Line 660
**Element:** div (topic stats container)
```tsx
style={{ display: 'flex', alignItems: 'center', gap: '6px' }}
```

### Style #11 — Line 661
**Element:** DocumentDatabase24Regular icon
```tsx
style={{ color: '#107c41' }}
```

---

## 2. Loading State (Styles #12)

### Style #12 — Line 755
**Element:** Loading spinner container div
```tsx
style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '300px' }}
```

---

## 3. Root Container (Styles #13)

### Style #13 — Line 761
**Element:** Root container div
```tsx
style={{ display: 'flex', flexDirection: 'column', gap: '32px', fontFamily: 'Segoe UI, sans-serif' }}
```

---

## 4. Exams View — Header & Empty State (Styles #14–24)

### Style #14 — Line 771
**Element:** div (exams view header row)
```tsx
style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}
```

### Style #15 — Line 773
**Element:** Text ("Exams (count)" title)
```tsx
style={{ color: '#242424' }}
```

### Style #16 — Line 774
**Element:** Text (exams subtitle)
```tsx
style={{ color: '#616161', marginTop: '4px' }}
```

### Style #17 — Line 777
**Element:** div (exams header actions)
```tsx
style={{ display: 'flex', gap: '12px', alignItems: 'center' }}
```

### Style #18 — Line 782
**Element:** PopoverSurface (exams filter popover)
```tsx
style={{ width: '280px', display: 'flex', flexDirection: 'column', gap: '12px' }}
```

### Style #19 — Line 806
**Element:** div (exams empty state wrapper)
```tsx
style={{ display: 'flex', justifyContent: 'center', width: '100%', padding: '40px 0' }}
```

### Style #20 — Line 807
**Element:** Card (exams empty state card)
```tsx
style={{ boxShadow: '0 4px 16px rgba(0,0,0,0.06)', borderRadius: '12px', border: '1px solid #e0e0e0', padding: '40px', textAlign: 'center', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '16px', maxWidth: '550px', width: '100%' }}
```

### Style #21 — Line 820
**Element:** Warning48Regular icon (exams empty state)
```tsx
style={{ color: '#0078d4' }}
```

### Style #22 — Line 821
**Element:** div (exams empty state text container)
```tsx
style={{ textAlign: 'center' }}
```

### Style #23 — Line 822
**Element:** Text ("No Exams Found" title)
```tsx
style={{ color: '#242424', marginBottom: '6px' }}
```

### Style #24 — Line 823
**Element:** Text (exams empty state subtitle)
```tsx
style={{ color: '#616161' }}
```

---

## 5. Exams View — DataGrid Card & Pagination (Styles #25–38)

### Style #25 — Line 832
**Element:** Card (exams data grid wrapper)
```tsx
style={{ boxShadow: '0 4px 12px rgba(0,0,0,0.08)', borderRadius: '12px', border: '1px solid #e0e0e0', overflow: 'hidden', padding: 0 }}
```

### Style #26 — Line 839
**Element:** div (exams scroll container)
```tsx
style={{ overflowX: 'auto', width: '100%' }}
```

### Style #27 — Line 840
**Element:** DataGrid (exams)
```tsx
style={{ minWidth: '800px' }}
```

### Style #28 — Line 841
**Element:** DataGridHeader (exams)
```tsx
style={{ backgroundColor: '#fafafa', borderBottom: '1px solid #eaeaea' }}
```

### Style #29 — Line 844
**Element:** DataGridHeaderCell (exams)
```tsx
style={{ padding: '12px 16px', fontWeight: 'bold' }}
```

### Style #30 — Line 850
**Element:** DataGridRow (exams)
```tsx
style={{ borderBottom: '1px solid #f0f0f0', transition: 'background 0.2s' }}
```

### Style #31 — Line 852
**Element:** DataGridCell (exams)
```tsx
style={{ padding: '16px' }}
```

### Style #32 — Line 861
**Element:** div (exams pagination footer)
```tsx
style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '16px', borderTop: '1px solid #eaeaea', backgroundColor: '#fafafa', flexWrap: 'wrap', gap: '12px' }}
```

### Style #33 — Line 862
**Element:** div (page size selector container)
```tsx
style={{ display: 'flex', alignItems: 'center', gap: '8px' }}
```

### Style #34 — Line 863
**Element:** Text ("Show" label)
```tsx
style={{ color: '#616161' }}
```

### Style #35 — Line 871
**Element:** Select (page size dropdown)
```tsx
style={{ width: '80px' }}
```

### Style #36 — Line 878
**Element:** Text ("entries" label)
```tsx
style={{ color: '#616161' }}
```

### Style #37 — Line 881
**Element:** Text (showing info)
```tsx
style={{ color: '#616161' }}
```

### Style #38 — Line 885
**Element:** div (pagination nav buttons)
```tsx
style={{ display: 'flex', gap: '8px' }}
```

---

## 6. Topics View — Header & Empty State (Styles #39–49)

### Style #39 — Line 911
**Element:** div (topics view header row)
```tsx
style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}
```

### Style #40 — Line 913
**Element:** Text ("Main Topics" / "Sub Topics" title)
```tsx
style={{ color: '#242424' }}
```

### Style #41 — Line 916
**Element:** Text (topics subtitle)
```tsx
style={{ color: '#616161', marginTop: '4px' }}
```

### Style #42 — Line 923
**Element:** div (topics header actions)
```tsx
style={{ display: 'flex', gap: '12px', alignItems: 'center' }}
```

### Style #43 — Line 928
**Element:** PopoverSurface (topics filter popover)
```tsx
style={{ width: '280px', display: 'flex', flexDirection: 'column', gap: '12px' }}
```

### Style #44 — Line 955
**Element:** div (topics empty state wrapper)
```tsx
style={{ display: 'flex', justifyContent: 'center', width: '100%', padding: '40px 0' }}
```

### Style #45 — Line 956
**Element:** Card (topics empty state card)
```tsx
style={{ boxShadow: '0 4px 16px rgba(0,0,0,0.06)', borderRadius: '12px', border: '1px solid #e0e0e0', padding: '40px', textAlign: 'center', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '16px', maxWidth: '550px', width: '100%' }}
```

### Style #46 — Line 969
**Element:** Warning48Regular icon (topics empty state)
```tsx
style={{ color: '#0078d4' }}
```

### Style #47 — Line 970
**Element:** div (topics empty state text container)
```tsx
style={{ textAlign: 'center' }}
```

### Style #48 — Line 971
**Element:** Text ("No Main/Sub Topics Found" title)
```tsx
style={{ color: '#242424', marginBottom: '6px' }}
```

### Style #49 — Line 974
**Element:** Text (topics empty state subtitle)
```tsx
style={{ color: '#616161' }}
```

---

## 7. Topics View — DataGrid Card & Pagination (Styles #50–63)

### Style #50 — Line 991
**Element:** Card (topics data grid wrapper)
```tsx
style={{ boxShadow: '0 4px 12px rgba(0,0,0,0.08)', borderRadius: '12px', border: '1px solid #e0e0e0', overflow: 'hidden', padding: 0 }}
```

### Style #51 — Line 998
**Element:** div (topics scroll container)
```tsx
style={{ overflowX: 'auto', width: '100%' }}
```

### Style #52 — Line 999
**Element:** DataGrid (topics)
```tsx
style={{ minWidth: '900px' }}
```

### Style #53 — Line 1000
**Element:** DataGridHeader (topics)
```tsx
style={{ backgroundColor: '#fafafa', borderBottom: '1px solid #eaeaea' }}
```

### Style #54 — Line 1003
**Element:** DataGridHeaderCell (topics)
```tsx
style={{ padding: '12px 16px', fontWeight: 'bold' }}
```

### Style #55 — Line 1009
**Element:** DataGridRow (topics)
```tsx
style={{ borderBottom: '1px solid #f0f0f0', transition: 'background 0.2s' }}
```

### Style #56 — Line 1011
**Element:** DataGridCell (topics)
```tsx
style={{ padding: '16px' }}
```

### Style #57 — Line 1020
**Element:** div (topics pagination footer)
```tsx
style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '16px', borderTop: '1px solid #eaeaea', backgroundColor: '#fafafa', flexWrap: 'wrap', gap: '12px' }}
```

### Style #58 — Line 1021
**Element:** div (page size selector container)
```tsx
style={{ display: 'flex', alignItems: 'center', gap: '8px' }}
```

### Style #59 — Line 1022
**Element:** Text ("Show" label)
```tsx
style={{ color: '#616161' }}
```

### Style #60 — Line 1030
**Element:** Select (page size dropdown)
```tsx
style={{ width: '80px' }}
```

### Style #61 — Line 1037
**Element:** Text ("entries" label)
```tsx
style={{ color: '#616161' }}
```

### Style #62 — Line 1040
**Element:** Text (showing info)
```tsx
style={{ color: '#616161' }}
```

### Style #63 — Line 1044
**Element:** div (pagination nav buttons)
```tsx
style={{ display: 'flex', gap: '8px' }}
```

---

## 8. Dialogs — Exam Dialog (Styles #64–68)

### Style #64 — Line 1069
**Element:** DialogSurface (exam dialog)
```tsx
style={{ borderRadius: '12px', padding: '24px' }}
```

### Style #65 — Line 1072
**Element:** DialogContent (exam dialog)
```tsx
style={{ display: 'flex', flexDirection: 'column', gap: '20px', paddingTop: '16px' }}
```

### Style #66 — Line 1074
**Element:** Input (exam title)
```tsx
style={{ width: '100%' }}
```

### Style #67 — Line 1077
**Element:** Textarea (exam description)
```tsx
style={{ width: '100%', minHeight: '80px' }}
```

### Style #68 — Line 1080
**Element:** DialogActions (exam dialog)
```tsx
style={{ marginTop: '24px' }}
```

---

## 9. Dialogs — Bulk Link Exam Topics (Styles #69–72)

### Style #69 — Line 1092
**Element:** DialogSurface (link exam topics dialog)
```tsx
style={{ borderRadius: '12px', padding: '24px' }}
```

### Style #70 — Line 1095
**Element:** DialogContent (link exam topics dialog)
```tsx
style={{ display: 'flex', flexDirection: 'column', gap: '20px', paddingTop: '16px' }}
```

### Style #71 — Line 1103
**Element:** Combobox (link exam topics)
```tsx
style={{ width: '100%' }}
```

### Style #72 — Line 1111
**Element:** DialogActions (link exam topics dialog)
```tsx
style={{ marginTop: '24px' }}
```

---

## 10. Dialogs — Bulk Link Subtopics (Styles #73–76)

### Style #73 — Line 1123
**Element:** DialogSurface (link subtopics dialog)
```tsx
style={{ borderRadius: '12px', padding: '24px' }}
```

### Style #74 — Line 1126
**Element:** DialogContent (link subtopics dialog)
```tsx
style={{ display: 'flex', flexDirection: 'column', gap: '20px', paddingTop: '16px' }}
```

### Style #75 — Line 1134
**Element:** Combobox (link subtopics)
```tsx
style={{ width: '100%' }}
```

### Style #76 — Line 1142
**Element:** DialogActions (link subtopics dialog)
```tsx
style={{ marginTop: '24px' }}
```

---

## 11. Dialogs — Bulk Link Quizzes (Styles #77–80)

### Style #77 — Line 1154
**Element:** DialogSurface (link quizzes dialog)
```tsx
style={{ borderRadius: '12px', padding: '24px' }}
```

### Style #78 — Line 1157
**Element:** DialogContent (link quizzes dialog)
```tsx
style={{ display: 'flex', flexDirection: 'column', gap: '20px', paddingTop: '16px' }}
```

### Style #79 — Line 1165
**Element:** Combobox (link quizzes)
```tsx
style={{ width: '100%' }}
```

### Style #80 — Line 1173
**Element:** DialogActions (link quizzes dialog)
```tsx
style={{ marginTop: '24px' }}
```

---

## 12. Dialogs — Generate Quiz with AI (Styles #81–84)

### Style #81 — Line 1185
**Element:** DialogSurface (generate quiz dialog)
```tsx
style={{ borderRadius: "14px", padding: "28px", maxWidth: "640px", width: "100%" }}
```

### Style #82 — Line 1188
**Element:** div (quiz dialog title wrapper)
```tsx
style={{ display: "flex", alignItems: "center", gap: "10px" }}
```

### Style #83 — Line 1189
**Element:** Sparkle20Regular icon
```tsx
style={{ color: "#0078d4" }}
```

### Style #84 — Line 1193
**Element:** DialogContent (generate quiz dialog)
```tsx
style={{ paddingTop: "16px" }}
```

---

## 13. Dialogs — Topic Dialog (Styles #85–89)

### Style #85 — Line 1208
**Element:** DialogSurface (topic dialog)
```tsx
style={{ borderRadius: '12px', padding: '24px' }}
```

### Style #86 — Line 1213
**Element:** DialogContent (topic dialog)
```tsx
style={{ display: 'flex', flexDirection: 'column', gap: '20px', paddingTop: '16px' }}
```

### Style #87 — Line 1215
**Element:** Input (topic title)
```tsx
style={{ width: '100%' }}
```

### Style #88 — Line 1218
**Element:** Textarea (topic description)
```tsx
style={{ width: '100%', minHeight: '80px' }}
```

### Style #89 — Line 1221
**Element:** DialogActions (topic dialog)
```tsx
style={{ marginTop: '24px' }}
```

---

## 14. Drawers — Exam Detail Drawer (Styles #90–104)

### Style #90 — Line 1236
**Element:** OverlayDrawer (exam detail)
```tsx
style={{ width: '550px', maxWidth: '100%', boxShadow: '-4px 0 24px rgba(0,0,0,0.15)' }}
```

### Style #91 — Line 1238
**Element:** DrawerHeader (exam detail)
```tsx
style={{ borderBottom: '1px solid #eaeaea', padding: '16px 24px' }}
```

### Style #92 — Line 1249
**Element:** div (exam drawer header content)
```tsx
style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}
```

### Style #93 — Line 1250
**Element:** Text (exam drawer title)
```tsx
style={{ color: '#242424' }}
```

### Style #94 — Line 1251
**Element:** Text (exam drawer description)
```tsx
style={{ color: '#616161', fontWeight: 'normal', lineHeight: '1.4' }}
```

### Style #95 — Line 1252
**Element:** span (exam description fallback "No description provided.")
```tsx
style={{ fontStyle: 'italic', color: '#b3b3b3' }}
```

### Style #96 — Line 1257
**Element:** DrawerBody (exam detail)
```tsx
style={{ padding: '24px', display: 'flex', flexDirection: 'column', gap: '20px' }}
```

### Style #97 — Line 1260
**Element:** div (linked topics section header)
```tsx
style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}
```

### Style #98 — Line 1261
**Element:** Text ("Linked Main Topics" title)
```tsx
style={{ color: '#242424' }}
```

### Style #99 — Line 1279
**Element:** div (linked topics list)
```tsx
style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}
```

### Style #100 — Line 1281
**Element:** Card (linked topic item)
```tsx
style={{ display: 'flex', flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: '12px 16px', border: '1px solid #f0f0f0', borderRadius: '8px', boxShadow: '0 2px 4px rgba(0,0,0,0.02)' }}
```

### Style #101 — Line 1282
**Element:** div (topic item text content)
```tsx
style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}
```

### Style #102 — Line 1283
**Element:** Text (topic item title)
```tsx
style={{ color: '#242424' }}
```

### Style #103 — Line 1290
**Element:** Button (unlink topic from exam)
```tsx
style={{ color: '#d13438' }}
```

### Style #104 — Line 1298
**Element:** div (no topics linked empty state)
```tsx
style={{ padding: '32px', textAlign: 'center', backgroundColor: '#fafafa', borderRadius: '8px', border: '1px dashed #d9d9d9' }}
```

### Style #105 — Line 1299
**Element:** Text ("No topics linked to this exam.")
```tsx
style={{ color: '#a19f9d' }}
```

---

## 15. Drawers — Topic/Subtopic Detail Drawer (Styles #106–122)

### Style #106 — Line 1311
**Element:** OverlayDrawer (topic detail)
```tsx
style={{ width: '550px', maxWidth: '100%', boxShadow: '-4px 0 24px rgba(0,0,0,0.15)' }}
```

### Style #107 — Line 1313
**Element:** DrawerHeader (topic detail)
```tsx
style={{ borderBottom: '1px solid #eaeaea', padding: '16px 24px' }}
```

### Style #108 — Line 1324
**Element:** div (topic drawer header content)
```tsx
style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}
```

### Style #109 — Line 1325
**Element:** div (topic drawer title row)
```tsx
style={{ display: 'flex', alignItems: 'center', gap: '8px' }}
```

### Style #110 — Line 1326
**Element:** Text (topic drawer title)
```tsx
style={{ color: '#242424' }}
```

### Style #111 — Line 1328
**Element:** Text (topic drawer description)
```tsx
style={{ color: '#616161', fontWeight: 'normal', lineHeight: '1.4' }}
```

### Style #112 — Line 1329
**Element:** span (topic description fallback "No description provided.")
```tsx
style={{ fontStyle: 'italic', color: '#b3b3b3' }}
```

### Style #113 — Line 1334
**Element:** DrawerBody (topic detail)
```tsx
style={{ padding: '24px', display: 'flex', flexDirection: 'column', gap: '20px' }}
```

### Style #114 — Line 1339
**Element:** div (linked subtopics/quizzes section header)
```tsx
style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}
```

### Style #115 — Line 1340
**Element:** Text ("Linked Subtopics" title)
```tsx
style={{ color: '#242424' }}
```

### Style #116 — Line 1356
**Element:** div (linked subtopics list)
```tsx
style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}
```

### Style #117 — Line 1358
**Element:** Card (linked subtopic item)
```tsx
style={{ display: 'flex', flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: '12px 16px', border: '1px solid #f0f0f0', borderRadius: '8px', boxShadow: '0 2px 4px rgba(0,0,0,0.02)' }}
```

### Style #118 — Line 1359
**Element:** div (subtopic item text content)
```tsx
style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}
```

### Style #119 — Line 1360
**Element:** Text (subtopic item title)
```tsx
style={{ color: '#242424' }}
```

### Style #120 — Line 1367
**Element:** Button (unlink subtopic)
```tsx
style={{ color: '#d13438' }}
```

### Style #121 — Line 1375
**Element:** div (no subtopics empty state)
```tsx
style={{ padding: '32px', textAlign: 'center', backgroundColor: '#fafafa', borderRadius: '8px', border: '1px dashed #d9d9d9' }}
```

### Style #122 — Line 1376
**Element:** Text ("No subtopics linked to this topic.")
```tsx
style={{ color: '#a19f9d' }}
```

---

## 16. Drawers — Topic/Subtopic Linked Quizzes Section (Styles #123–135)

### Style #123 — Line 1383
**Element:** div (linked quizzes section header)
```tsx
style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px', flexWrap: 'wrap', gap: '8px' }}
```

### Style #124 — Line 1384
**Element:** Text ("Linked Quizzes" title)
```tsx
style={{ color: '#242424' }}
```

### Style #125 — Line 1385
**Element:** div (quizzes action buttons)
```tsx
style={{ display: 'flex', gap: '8px' }}
```

### Style #126 — Line 1412
**Element:** div (quizzes list)
```tsx
style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}
```

### Style #127 — Line 1414
**Element:** Card (quiz item card)
```tsx
style={{ display: 'flex', flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: '12px 16px', border: '1px solid #f0f0f0', borderRadius: '8px', boxShadow: '0 2px 4px rgba(0,0,0,0.02)' }}
```

### Style #128 — Line 1415
**Element:** div (quiz item text content)
```tsx
style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}
```

### Style #129 — Line 1419
**Element:** LinkButton (quiz title link)
```tsx
style={{ padding: 0, height: 'auto', fontWeight: 'bold', color: '#0078d4', textAlign: 'left', justifyContent: 'flex-start', minWidth: 'auto' }}
```

### Style #130 — Line 1425
**Element:** Text (quiz order & question count)
```tsx
style={{ color: '#616161' }}
```

### Style #131 — Line 1428
**Element:** div (quiz action buttons)
```tsx
style={{ display: 'flex', alignItems: 'center', gap: '4px' }}
```

### Style #132 — Line 1435
**Element:** Button (unlink quiz)
```tsx
style={{ color: '#616161' }}
```

### Style #133 — Line 1444
**Element:** Button (delete quiz)
```tsx
style={{ color: '#d13438' }}
```

### Style #134 — Line 1453
**Element:** div (no quizzes empty state)
```tsx
style={{ padding: '32px', textAlign: 'center', backgroundColor: '#fafafa', borderRadius: '8px', border: '1px dashed #d9d9d9' }}
```

### Style #135 — Line 1454
**Element:** Text ("No quizzes linked to this subtopic.")
```tsx
style={{ color: '#a19f9d' }}
```

---

## 17. Drawers — Quiz Detail Drawer (Styles #136–157)

### Style #136 — Line 1468
**Element:** OverlayDrawer (quiz detail)
```tsx
style={{ width: "500px", maxWidth: "100%", boxShadow: "-4px 0 24px rgba(0,0,0,0.12)" }}
```

### Style #137 — Line 1470
**Element:** DrawerHeader (quiz detail)
```tsx
style={{ borderBottom: "1px solid #eaeaea", padding: "16px 24px" }}
```

### Style #138 — Line 1476
**Element:** div (quiz drawer header content)
```tsx
style={{ display: "flex", flexDirection: "column", gap: "4px" }}
```

### Style #139 — Line 1477
**Element:** div (quiz drawer title row)
```tsx
style={{ display: "flex", alignItems: "center", gap: "8px" }}
```

### Style #140 — Line 1478
**Element:** Text (quiz drawer title)
```tsx
style={{ color: "#242424" }}
```

### Style #141 — Line 1481
**Element:** Text (quiz order & question count)
```tsx
style={{ color: "#6b7280" }}
```

### Style #142 — Line 1488
**Element:** DrawerBody (quiz detail)
```tsx
style={{ padding: "24px", display: "flex", flexDirection: "column", gap: "20px" }}
```

### Style #143 — Line 1491
**Element:** div (questions section header)
```tsx
style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "14px" }}
```

### Style #144 — Line 1492
**Element:** Text ("Questions" title)
```tsx
style={{ color: "#242424" }}
```

### Style #145 — Line 1501
**Element:** div (questions loading spinner)
```tsx
style={{ display: "flex", justifyContent: "center", padding: "20px" }}
```

### Style #146 — Line 1505
**Element:** div (questions list)
```tsx
style={{ display: "flex", flexDirection: "column", gap: "12px" }}
```

### Style #147 — Line 1507
**Element:** Card (question card)
```tsx
style={{ display: "flex", flexDirection: "column", gap: "8px", padding: "16px", border: "1px solid #f0f0f0", borderRadius: "8px", boxShadow: "0 1px 4px rgba(0,0,0,0.04)" }}
```

### Style #148 — Line 1511
**Element:** div (question header row)
```tsx
style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: "8px" }}
```

### Style #149 — Line 1512
**Element:** Text (question text)
```tsx
style={{ color: "#1f2937", lineHeight: "1.4" }}
```

### Style #150 — Line 1515
**Element:** div (question action buttons)
```tsx
style={{ display: "flex", gap: "4px" }}
```

### Style #151 — Line 1523
**Element:** Button (delete question)
```tsx
style={{ color: "#d13438" }}
```

### Style #152 — Line 1530
**Element:** div (question options container)
```tsx
style={{ display: "flex", flexDirection: "column", gap: "4px", paddingLeft: "12px", borderLeft: "2px solid #e5e7eb" }}
```

### Style #153 — Line 1537
**Element:** Text (option text — conditional correct/incorrect)
```tsx
style={{ color: isCorrect ? "#16a34a" : "#4b5563", fontWeight: isCorrect ? "bold" : "normal" }}
```

### Style #154 — Line 1549
**Element:** Text (hint)
```tsx
style={{ color: "#6b7280", fontStyle: "italic" }}
```

### Style #155 — Line 1554
**Element:** Text (explanation)
```tsx
style={{ color: "#6b7280" }}
```

### Style #156 — Line 1562
**Element:** div (no questions empty state)
```tsx
style={{ padding: "32px", textAlign: "center", backgroundColor: "#fafafa", borderRadius: "8px", border: "1px dashed #d9d9d9" }}
```

### Style #157 — Line 1563
**Element:** Text ("No questions linked...")
```tsx
style={{ color: "#9ca3af" }}
```

---

## 18. Dialogs — Add/Edit Question Dialog (Styles #158–164)

### Style #158 — Line 1572
**Element:** DialogSurface (question dialog)
```tsx
style={{ borderRadius: "14px", padding: "28px", maxWidth: "600px", width: "100%" }}
```

### Style #159 — Line 1577
**Element:** DialogContent (question dialog)
```tsx
style={{ display: "flex", flexDirection: "column", gap: "16px", paddingTop: "16px" }}
```

### Style #160 — Line 1583
**Element:** Textarea (question text)
```tsx
style={{ width: "100%", minHeight: "80px" }}
```

### Style #161 — Line 1587
**Element:** div (options grid)
```tsx
style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px" }}
```

### Style #162 — Line 1603
**Element:** Select (correct answer)
```tsx
style={{ width: "100%" }}
```

### Style #163 — Line 1625
**Element:** Textarea (explanation)
```tsx
style={{ width: "100%", minHeight: "80px" }}
```

### Style #164 — Line 1629
**Element:** DialogActions (question dialog)
```tsx
style={{ marginTop: "24px" }}
```

---

## 19. Dialogs — Confirmation Dialog (Styles #165–169)

### Style #165 — Line 1643
**Element:** DialogSurface (confirm dialog)
```tsx
style={{ borderRadius: '12px', padding: '24px', maxWidth: '400px' }}
```

### Style #166 — Line 1646
**Element:** DialogContent (confirm dialog)
```tsx
style={{ paddingTop: '12px' }}
```

### Style #167 — Line 1647
**Element:** Text (confirm description)
```tsx
style={{ color: '#616161', fontSize: '14px', lineHeight: '1.5' }}
```

### Style #168 — Line 1651
**Element:** DialogActions (confirm dialog)
```tsx
style={{ marginTop: '24px' }}
```

### Style #169 — Line 1657
**Element:** Button (confirm destructive action)
```tsx
style={{ backgroundColor: '#d13438', borderColor: '#d13438', color: '#ffffff' }}
```

---

## Summary by Group

| Group | Count | Lines |
|-------|-------|-------|
| Exams View — DataGrid & Columns | 11 | 551–661 |
| Loading State | 1 | 755 |
| Root Container | 1 | 761 |
| Exams View — Header & Empty State | 11 | 771–823 |
| Exams View — DataGrid Card & Pagination | 14 | 832–885 |
| Topics View — Header & Empty State | 11 | 911–974 |
| Topics View — DataGrid Card & Pagination | 14 | 991–1044 |
| Dialogs — Exam Dialog | 5 | 1069–1080 |
| Dialogs — Bulk Link Exam Topics | 4 | 1092–1111 |
| Dialogs — Bulk Link Subtopics | 4 | 1123–1142 |
| Dialogs — Bulk Link Quizzes | 4 | 1154–1173 |
| Dialogs — Generate Quiz with AI | 4 | 1185–1193 |
| Dialogs — Topic Dialog | 5 | 1208–1221 |
| Drawers — Exam Detail Drawer | 16 | 1236–1299 |
| Drawers — Topic/Subtopic Detail Drawer | 17 | 1311–1376 |
| Drawers — Topic/Subtopic Linked Quizzes | 13 | 1383–1454 |
| Drawers — Quiz Detail Drawer | 22 | 1468–1563 |
| Dialogs — Add/Edit Question Dialog | 7 | 1572–1629 |
| Dialogs — Confirmation Dialog | 5 | 1643–1657 |
| **Total** | **169** | |

---

## Griffel makeStyles Mapping Notes

- **Reusable Card styles:** #20, #25, #45, #50, #100, #117, #127, #147 are all identical or near-identical Card containers. Can be consolidated into a single `card` slot.
- **Reusable DialogSurface styles:** #64, #69, #73, #77, #85 are identical (`borderRadius: '12px', padding: '24px'`). Can be one `dialogSurface` slot.
- **Reusable DialogContent styles:** #65, #70, #74, #78, #86 are identical (`display: 'flex', flexDirection: 'column', gap: '20px', paddingTop: '16px'`). Can be one `dialogContent` slot.
- **Reusable DialogActions styles:** #68, #72, #76, #80, #89 are identical (`marginTop: '24px'`). Can be one `dialogActions` slot.
- **Reusable empty state styles:** #104, #121, #134, #156 are identical. Can be one `emptyState` slot.
- **Reusable DrawerHeader styles:** #91, #107, #137 are identical. Can be one `drawerHeader` slot.
- **Reusable DrawerBody styles:** #96, #113, #142 are identical. Can be one `drawerBody` slot.
- **Reusable OverlayDrawer styles:** #90, #106 are identical. #136 is similar but smaller width.
- **Reusable DataGridRow styles:** #30, #55 are identical.
- **Reusable DataGridCell styles:** #31, #56 are identical.
- **Reusable DataGridHeader styles:** #28, #53 are identical.
- **Reusable DataGridHeaderCell styles:** #29, #54 are identical.
- **Reusable section header styles:** #97, #114, #123, #143 are similar flex row headers.
