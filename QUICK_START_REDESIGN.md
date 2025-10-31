# Quick Start - Redesigned App

## 🚀 Testing the New Design

### 1. Start the Dev Server
```bash
cd frontend
pnpm dev
```

### 2. Navigate to Dashboard
Open: `http://localhost:5173/dashboard`

## ✨ Features to Test

### Theme Switcher (Top Right)
1. Look for the theme button in header (☀️/🌙/🔄)
2. Click to cycle: Light → Dark → Auto
3. Notice smooth color transitions
4. Avidys green color scheme in both modes

### Upload Datasets
1. Click or drag CSV files into upload area
2. Files parse immediately
3. See dataset cards appear with:
   - Dataset name
   - Row count
   - Column count
   - Domain badge (if applicable)

### Select Compliance Standard
1. Only appears after datasets uploaded
2. Choose from dropdown
3. See green checkmark confirmation

### View Dataset in Separate Window
1. Click 🔍 **View** button on any dataset
2. New window opens with DataFileViewer
3. All features available:
   - Sort columns
   - Filter rows
   - Select rows
   - Export selected
   - View column statistics

### Run Compliance Check
1. Select a standard first
2. Click ▶️ **Run Check** on any dataset
3. See loading indicator
4. Results appear in "Recent Compliance Runs" table

## 🎨 Theme Comparison

### Light Mode (☀️)
- Clean white background
- Dark green text for readability
- Emerald green accents
- Professional appearance

### Dark Mode (🌙)
- Dark green-tinted background
- Light green text
- Glowing emerald buttons
- Easy on eyes

### Auto Mode (🔄)
- Follows your OS setting
- Changes automatically
- Best of both worlds

## 📊 Multiple Viewers
Try opening multiple datasets:
1. Click View on first dataset → Window 1
2. Click View on second dataset → Window 2
3. Both windows work independently
4. Sort/filter in each separately

## 🎯 Workflow Test

Complete workflow:
```
1. Upload 2-3 CSV files
   ↓
2. See all datasets listed
   ↓
3. Select compliance standard
   ↓
4. Click "View" on one dataset (new window)
   ↓
5. Click "Run Check" on another dataset
   ↓
6. Check "Recent Compliance Runs" table
```

## 🌈 Visual Changes to Notice

### Header:
- Avidys logo on left
- Theme switcher on right
- Sticky (stays on scroll)
- Green accent on brand name

### Dashboard:
- 3 numbered sections
- Card-based design
- Green success/warning alerts
- Smooth hover effects

### Buttons:
- Green primary color
- Hover: darker green + lift effect
- Icons for clarity
- Consistent sizing

### Tables:
- Alternating row hover
- Color-coded errors (red) and warnings (yellow)
- Clean borders
- Responsive scrolling

## 🐛 Quick Troubleshooting

### Theme not changing?
- Check browser console for errors
- Clear localStorage: `localStorage.clear()`
- Refresh page

### Dataset not loading in viewer?
- Check sessionStorage in dev tools
- Try re-uploading the file
- Ensure CSV is valid

### Upload not working?
- Only CSV/TXT files supported
- Check file is not empty
- Look for error message below upload

## 📱 Mobile Testing

1. Open Chrome DevTools
2. Toggle device toolbar (Ctrl+Shift+M)
3. Test responsive design:
   - Header collapses properly
   - Upload area adapts
   - Tables scroll horizontally
   - Buttons stack vertically

## 🎉 Success Indicators

You'll know it's working when:
- ✅ Theme changes smoothly
- ✅ Upload shows dataset immediately
- ✅ Standard selection enables compliance checks
- ✅ Viewer opens in new window
- ✅ Green colors throughout
- ✅ Responsive on all screen sizes

## 💡 Tips

1. **Best Browser**: Chrome/Edge for full features
2. **File Size**: Start with small CSVs (<1MB)
3. **Multiple Tests**: Try uploading 3-5 files
4. **Theme**: Try auto mode to see it adapt
5. **Windows**: Open 2-3 viewers simultaneously

## 🔥 Cool Features to Show Off

1. **Drag & Drop**: Drag CSV directly onto upload area
2. **Live Parsing**: No submit button needed
3. **Multi-Window**: View multiple datasets
4. **Theme Persistence**: Close/reopen browser - theme remembered
5. **Column Stats**: Expand in viewer for insights
6. **Virtual Scrolling**: Load 10K+ row files smoothly

## 📸 Screenshot Checklist

Capture these views:
- [ ] Dashboard with uploaded datasets
- [ ] Light mode vs Dark mode comparison
- [ ] DataFileViewer in separate window
- [ ] Multiple windows open
- [ ] Compliance runs table
- [ ] Mobile responsive view

## 🎓 Demo Script

Perfect for showing to others:

> "Watch this - I'll upload a CSV file... *drag file*
> 
> It parses instantly! See the dataset card?
> 
> Now I select a compliance standard... *select*
> 
> I can view the data in a separate window... *click View*
> 
> Look - full sorting, filtering, everything!
> 
> And check out the theme switcher... *click theme button*
> 
> Boom! Avidys green in both light and dark modes!"

---

Ready to test? Fire up that dev server! 🚀

