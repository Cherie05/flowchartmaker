import { test, expect } from '@playwright/test';

test('loads editor and verifies basic UI', async ({ page }) => {
  // Start at the Dashboard
  await page.goto('/dashboard');
  
  // Click the 'New board' button to enter the Editor
  await page.click('button:has-text("New board")');

  // Wait for the app to load and display the default "New Flowchart"
  await expect(page.locator('input[value="New Flowchart"]')).toBeVisible();

  // Verify the top bar has the "Present" and "Export" buttons
  await expect(page.getByRole('button', { name: 'Present', exact: true })).toBeVisible();
  await expect(page.getByRole('button', { name: 'Export', exact: true })).toBeVisible();

  // The tool rail should have basic shape buttons
  await expect(page.locator('button:has-text("Process")')).toBeVisible();
  await expect(page.locator('button:has-text("Decision")')).toBeVisible();
});
