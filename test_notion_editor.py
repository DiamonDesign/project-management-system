#!/usr/bin/env python3
"""
Simple test script for the Notion-level page editor
Requires manual navigation but will take screenshots at each step
"""

import subprocess
import time
import os

def take_screenshot(name, description):
    """Take a screenshot using macOS screencapture"""
    filename = f"screenshot_{name}_{int(time.time())}.png"
    print(f"\n📸 Taking screenshot: {filename}")
    print(f"   Description: {description}")
    
    # Take screenshot of entire screen
    subprocess.run(['screencapture', '-x', filename], check=True)
    print(f"   Screenshot saved: {filename}")
    return filename

def main():
    print("🚀 Notion-level Editor Testing Script")
    print("=" * 50)
    print("\nThis script will guide you through testing the editor and take screenshots")
    print("Make sure the application is running at http://localhost:8081\n")
    
    input("Press Enter when you're ready to start...")
    
    # Step 1: Homepage
    print("\n1️⃣ Navigate to http://localhost:8081")
    input("Press Enter when the homepage is loaded...")
    take_screenshot("01_homepage", "Application homepage")
    
    # Step 2: Navigate to dashboard/projects
    print("\n2️⃣ Navigate to the dashboard or projects section")
    print("   Look for 'Dashboard' or 'Projects' links")
    input("Press Enter when you're on the dashboard/projects page...")
    take_screenshot("02_dashboard", "Dashboard or projects page")
    
    # Step 3: Open a project
    print("\n3️⃣ Click on a project (like 'E-commerce Platform' if available)")
    input("Press Enter when you're viewing a project...")
    take_screenshot("03_project", "Project detail page")
    
    # Step 4: Open or create a page
    print("\n4️⃣ Open an existing page or create a new page")
    print("   Look for pages list or 'New Page' / 'Add Page' buttons")
    input("Press Enter when you see a page or the page creation interface...")
    take_screenshot("04_page_view", "Page view or creation interface")
    
    # Step 5: Enter edit mode
    print("\n5️⃣ Click 'Edit' button to enter editing mode")
    print("   You should see the Notion-level editor appear")
    input("Press Enter when the editor is visible...")
    take_screenshot("05_editor", "Notion-level editor interface")
    
    # Step 6: Test typing
    print("\n6️⃣ Type some text in the editor")
    print("   Try typing: 'Testing the Notion-level Editor'")
    input("Press Enter after typing some text...")
    take_screenshot("06_typing", "Editor with typed text")
    
    # Step 7: Test slash commands
    print("\n7️⃣ Test slash commands")
    print("   Type '/' to open the slash command menu")
    print("   You should see a menu with options like headings, lists, etc.")
    input("Press Enter when the slash menu is visible...")
    take_screenshot("07_slash_menu", "Slash command menu")
    
    # Step 8: Try different block types
    print("\n8️⃣ Try creating different block types")
    print("   Select a heading from the slash menu")
    print("   Then try creating a list, code block, or quote")
    input("Press Enter after creating different block types...")
    take_screenshot("08_block_types", "Different block types in editor")
    
    # Step 9: Test keyboard shortcuts
    print("\n9️⃣ Test keyboard shortcuts")
    print("   Try Ctrl+B for bold, Ctrl+I for italic")
    print("   Select some text and apply formatting")
    input("Press Enter after testing keyboard shortcuts...")
    take_screenshot("09_formatting", "Text formatting with shortcuts")
    
    # Step 10: Final overview
    print("\n🔟 Final overview")
    print("   Show the complete editor with various content")
    input("Press Enter for final screenshot...")
    take_screenshot("10_final", "Complete editor overview")
    
    print("\n✅ Testing complete!")
    print("Screenshots have been saved in the current directory")
    
    # List all screenshot files
    screenshots = [f for f in os.listdir('.') if f.startswith('screenshot_') and f.endswith('.png')]
    if screenshots:
        print("\n📸 Screenshots taken:")
        for screenshot in sorted(screenshots):
            print(f"   • {screenshot}")

if __name__ == "__main__":
    main()