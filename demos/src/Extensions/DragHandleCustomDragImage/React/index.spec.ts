import { expect, test } from '@playwright/test'

test.describe('/src/Extensions/DragHandleCustomDragImage/React/', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/src/Extensions/DragHandleCustomDragImage/React/')
    await page.locator('.tiptap table').waitFor()
  })

  test('drags the table with the custom drag image', async ({ page }) => {
    const cell = await page.locator('.tiptap td').first().boundingBox()

    await page.mouse.move(cell!.x + 5, cell!.y + 5)
    await page.mouse.move(cell!.x + 8, cell!.y + 6)

    const handle = page.locator('.drag-handle')

    await expect(handle).toBeVisible()

    const handleBox = await handle.boundingBox()

    await page.mouse.move(handleBox!.x + handleBox!.width / 2, handleBox!.y + handleBox!.height / 2)
    await page.mouse.down()
    await page.mouse.move(handleBox!.x + 30, handleBox!.y + 30, { steps: 3 })

    await expect(page.locator('body > div[dir] > .custom-drag-image')).toHaveText('Moving table')

    const paragraph = await page.locator('.tiptap > p').first().boundingBox()

    await page.mouse.move(paragraph!.x + 50, paragraph!.y + 2, { steps: 5 })
    await page.mouse.up()

    await expect(page.locator('.tiptap > :first-child')).toHaveClass('tableWrapper')
    await expect(page.locator('.custom-drag-image')).toHaveCount(0)
  })
})
