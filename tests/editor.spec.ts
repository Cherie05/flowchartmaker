import { expect, test } from '@playwright/test';

test.beforeEach(async ({ page }) => {
  await page.goto('/');
  await page.evaluate(() => window.localStorage.clear());
});

test('opens the local workspace directly from the landing page', async ({ page }) => {
  await page.goto('/');
  await expect(page.getByRole('button', { name: 'Try Tool' }).first()).toBeVisible();

  await page.getByRole('button', { name: 'Try Tool' }).first().click();
  await expect(page).toHaveURL('/dashboard');
  await expect(page.getByRole('heading', { name: 'Your diagrams' })).toBeVisible();
  await expect(page.getByRole('heading', { name: 'Create your first diagram' })).toBeVisible();
  await expect(page.getByText('Your diagrams are saved in this browser.')).toBeVisible();
  await expect(page.locator('input[type="email"]')).toHaveCount(0);
});

test('creates, saves, renames, duplicates, and safely deletes a local diagram', async ({ page }) => {
  await page.goto('/dashboard');
  await page.getByRole('button', { name: 'Blank Flowchart' }).click();
  await expect(page).toHaveURL(/\/editor\/flowchart-/);

  const nameInput = page.getByLabel('Diagram name');
  await expect(nameInput).toHaveValue('Untitled Diagram');
  await nameInput.fill('Release process');

  await page.getByRole('button', { name: 'Start', exact: true }).click();
  await page.getByRole('button', { name: 'Add Process node' }).click();
  await expect(page.locator('[data-node-id]')).toHaveCount(2);

  await page.getByRole('button', { name: 'Undo' }).click();
  await expect(page.locator('[data-node-id]')).toHaveCount(1);
  await page.getByRole('button', { name: 'Redo' }).click();
  await expect(page.locator('[data-node-id]')).toHaveCount(2);
  await expect(page.getByText('Saved locally')).toBeVisible({ timeout: 5_000 });

  await page.reload();
  await expect(page.getByLabel('Diagram name')).toHaveValue('Release process');
  await expect(page.locator('[data-node-id]')).toHaveCount(2);

  const downloadPromise = page.waitForEvent('download');
  await page.getByRole('button', { name: 'Export' }).click();
  await page.getByRole('menuitem', { name: 'Export JSON' }).click();
  await downloadPromise;

  await page.getByRole('button', { name: 'Back to dashboard' }).click();
  await expect(page).toHaveURL('/dashboard');
  const card = page.getByRole('article').filter({ hasText: 'Release process' });
  await expect(card).toBeVisible();

  await card.getByRole('button', { name: 'Rename diagram' }).click();
  const renameInput = page.getByLabel('Diagram name');
  await renameInput.fill('Release workflow');
  await renameInput.press('Enter');
  await expect(page.getByRole('heading', { name: 'Release workflow' })).toBeVisible();

  const renamedCard = page.getByRole('article').filter({ hasText: 'Release workflow' }).filter({ hasNotText: '(Copy)' });
  await renamedCard.getByRole('button', { name: 'Duplicate diagram' }).click();
  await expect(page.getByRole('heading', { name: 'Release workflow (Copy)' })).toBeVisible();

  const copyCard = page.getByRole('article').filter({ hasText: 'Release workflow (Copy)' });
  await copyCard.getByRole('button', { name: 'Delete diagram' }).click();
  const dialog = page.getByRole('alertdialog', { name: 'Delete diagram?' });
  await expect(dialog).toBeVisible();
  await expect(dialog.getByRole('button', { name: 'Keep diagram' })).toBeFocused();
  await dialog.getByRole('button', { name: 'Delete diagram' }).click();
  await expect(page.getByRole('heading', { name: 'Release workflow (Copy)' })).toHaveCount(0);

  await page.reload();
  await expect(page.getByRole('heading', { name: 'Release workflow' })).toBeVisible();
});

test('handles an unknown editor id without an access gate', async ({ page }) => {
  await page.goto('/editor/not-a-real-diagram');
  await expect(page.getByRole('heading', { name: 'Diagram not found' })).toBeVisible();
  await expect(page.getByRole('button', { name: 'Back to dashboard' })).toBeVisible();
  await expect(page.locator('input[type="email"]')).toHaveCount(0);
});

test('connects two nodes and includes the connection in undo and redo', async ({ page }) => {
  await page.goto('/dashboard');
  await page.getByRole('button', { name: 'Blank Flowchart' }).click();
  await page.getByRole('button', { name: 'Start', exact: true }).click();
  await page.getByRole('button', { name: 'Add Process node' }).click();

  const source = page.locator('[data-node-id]').first();
  const target = page.locator('[data-node-id]').nth(1);
  await source.hover();
  const handle = source.getByTitle('Connect from right');
  const handleBox = await handle.boundingBox();
  const targetBox = await target.boundingBox();
  expect(handleBox).not.toBeNull();
  expect(targetBox).not.toBeNull();

  await page.mouse.move(handleBox!.x + handleBox!.width / 2, handleBox!.y + handleBox!.height / 2);
  await page.mouse.down();
  await page.mouse.move(targetBox!.x + targetBox!.width / 2, targetBox!.y + targetBox!.height / 2, { steps: 8 });
  await page.mouse.up();
  await expect(page.locator('[data-connection-id]')).toHaveCount(1);

  await page.getByRole('button', { name: 'Undo' }).click();
  await expect(page.locator('[data-connection-id]')).toHaveCount(0);
  await page.getByRole('button', { name: 'Redo' }).click();
  await expect(page.locator('[data-connection-id]')).toHaveCount(1);
});

test('clear board requires confirmation and Escape closes the dialog', async ({ page }) => {
  await page.goto('/dashboard');
  await page.getByRole('button', { name: 'Approval Process' }).click();
  await expect(page.locator('[data-node-id]')).toHaveCount(5);

  const moreButton = page.getByRole('button', { name: 'More diagram actions' });
  await moreButton.click();
  await page.getByRole('menuitem', { name: 'Clear board' }).click();
  const dialog = page.getByRole('alertdialog');
  await expect(dialog).toBeVisible();
  await page.keyboard.press('Escape');
  await expect(dialog).toBeHidden();
  await expect(moreButton).toBeFocused();
  await expect(page.locator('[data-node-id]')).toHaveCount(5);

  await moreButton.click();
  await page.getByRole('menuitem', { name: 'Clear board' }).click();
  await dialog.getByRole('button', { name: /clear/i }).click();
  await expect(page.locator('[data-node-id]')).toHaveCount(0);
});
