import { expect, Page, test, TestInfo } from "@playwright/test";
import { createAndJoinPeer, createRoom, takeScreenshot } from "./utils";

export const addBothMockTracks = async (page: Page) =>
  await test.step("Add both tracks", async () => {
    await page.getByRole("button", { name: "Add both", exact: true }).click();
  });

export const assertThatBothTrackAreReady = async (page: Page, otherClientId: string) => {
  await test.step("Assert that both tracks are ready", async () => {
    await expect(
      async () => (await page.locator(`div[data-endpoint-id="${otherClientId}"]`).all()).length > 2,
    ).toPass();
  });
};

export const assertThatTrackIdIsNotEmpty = async (page: Page, locator: string) => {
  await test.step("Assert that track id is not empty", async () => {
    await expect(async () => {
      expect((await page.locator(locator).textContent())?.trim()?.length ?? 0).toBeGreaterThan(0);
    }).toPass();
  });
};

export const assertThatBothTrackAreDifferent = async (page: Page, testInfo: TestInfo) => {
  await test.step("Assert that both tracks are different", async () => {
    const locator1 = `(//div[@data-name="stream-id"])[1]`;
    const locator2 = `(//div[@data-name="stream-id"])[2]`;

    await assertThatTrackIdIsNotEmpty(page, locator1);
    await assertThatTrackIdIsNotEmpty(page, locator2);

    await takeScreenshot(page, testInfo);

    const text1 = await page.locator(locator1).textContent();
    const text2 = await page.locator(locator2).textContent();

    expect(text1 !== "").toBe(true);
    expect(text2 !== "").toBe(true);
    expect(text1 !== text2).toBe(true);
  });
};

test("Add 2 tracks at the same time RC", async ({ page: senderPage, context }, testInfo) => {
  // given
  await senderPage.goto("/");
  const roomId = await createRoom(senderPage);

  const senderId = await createAndJoinPeer(senderPage, roomId);

  // when
  await addBothMockTracks(senderPage);

  // then
  const receiverPage = await context.newPage();
  await receiverPage.goto("/");
  await createAndJoinPeer(receiverPage, roomId);

  await assertThatBothTrackAreReady(receiverPage, senderId);
  await assertThatBothTrackAreDifferent(receiverPage, testInfo);
});

export const addOneTrack = async (page: Page, name: string) =>
  await test.step(`Add '${name}' track`, async () => {
    await page.getByRole("button", { name: name, exact: true }).click();
  });

test("Add 2 tracks separately", async ({ page: senderPage, context }, testInfo) => {
  // given
  await senderPage.goto("/");
  const roomId = await createRoom(senderPage);

  const senderId = await createAndJoinPeer(senderPage, roomId);

  // when
  await addOneTrack(senderPage, "Add a heart");
  await senderPage.waitForTimeout(500);
  await addOneTrack(senderPage, "Add a brain");

  // then
  const receiverPage = await context.newPage();
  await receiverPage.goto("/");
  await createAndJoinPeer(receiverPage, roomId);

  await assertThatBothTrackAreReady(receiverPage, senderId);
  await assertThatBothTrackAreDifferent(receiverPage, testInfo);
});
