import { onCall, HttpsError } from 'firebase-functions/v2/https'
import { logger } from 'firebase-functions'
import { webcrypto } from 'crypto'
import { initializeApp } from 'firebase-admin/app'
import { getDatabase } from 'firebase-admin/database'
import { getFirestore } from 'firebase-admin/firestore'
import { onValueDeleted } from 'firebase-functions/database'
initializeApp()
const realtimeDB = getDatabase()
const firestoreDB = getFirestore()

const produceRoomId = () => {
	const charset = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789'
	const divisibleValue = Math.floor(256 / charset.length) * charset.length

	let result = ''
	while (result.length < 6) {
		const randomValues = new Uint8Array((6 - result.length) * 2)
		webcrypto.getRandomValues(randomValues)
		for (let i = 0; i < randomValues.length && result.length < 6; i++) {
			if (randomValues[i] < divisibleValue) {
				result += charset[randomValues[i] % charset.length]
			}
		}
	}
	return result
}
// , enforceAppCheck: true
export const createRoom = onCall({ region: 'asia-southeast1' }, async (request) => {
	/* 沒登入不能使用該函數 */
	if (!request.auth) {
		logger.warn('使用者沒登入，嘗試創建房間')
		throw new HttpsError('unauthenticated', '請先登入')
	}
	/* 先確定玩家是否已在房間內 */
	const userUid = request.auth.uid
	const userRoomsUidRef = realtimeDB.ref('userRooms/' + userUid)
	const userRoomsUidSnap = await userRoomsUidRef.get()
	if (userRoomsUidSnap.exists()) {
		logger.warn('使用者已進入一個房間，又嘗試創建房間')
		throw new HttpsError('failed-precondition', '已參與其他遊戲室')
	}
	let roomId
	let roomIdsRoomIdSnap
	let count = 1
	do {
		roomId = produceRoomId()
		const roomIdsRoomIdRef = realtimeDB.ref('roomIds/' + roomId)
		roomIdsRoomIdSnap = await roomIdsRoomIdRef.get()
		count++
	} while (roomIdsRoomIdSnap.exists() && count <= 10)
	if (count > 10) {
		logger.warn('產生十次roomId都與已存在的roomId重複')
		throw new HttpsError('resource-exhausted', '系統忙碌或發生錯誤，請稍後再試')
	}
	const updates = {
		['rooms/' + roomId]: {
			roomOwner: userUid,
			full: false,
		},
		['userRooms/' + userUid]: roomId,
		['roomIds/' + roomId]: true,
	}
	await realtimeDB.ref().update(updates)
	logger.log('成功建立房間')
	return {
		success: true,
		roomId: roomId,
	}
})
export const enterRoom = onCall({ region: 'asia-southeast1' }, async (request) => {
	/* 沒登入不能使用該函數 */
	if (!request.auth) {
		logger.warn('使用者沒登入，嘗試進入房間')
		throw new HttpsError('unauthenticated', '請先登入')
	}
	/* 先確定玩家是否已在房間內 */
	const userUid = request.auth.uid
	const userRoomsUidRef = realtimeDB.ref('userRooms/' + userUid)
	const userRoomsUidSnap = await userRoomsUidRef.get()
	if (userRoomsUidSnap.exists()) {
		logger.warn('使用者已進入一個房間，又嘗試進入另一個房間' + userUid)
		throw new HttpsError('failed-precondition', '已參與其他遊戲室')
	}
	const inviteCode = request.data.inviteCode
	const roomsInviteCodeRef = realtimeDB.ref('rooms/' + inviteCode)
	const roomsInviteCodeSnap = await roomsInviteCodeRef.get()
	if (!roomsInviteCodeSnap.exists()) {
		logger.warn('使用者輸入不存在的邀請碼')
		throw new HttpsError('failed-precondition', '邀請碼不存在')
	} else if (roomsInviteCodeSnap.val().fill) {
		logger.warn('使用者要進入的房間已滿')
		throw new HttpsError('failed-precondition', '遊戲室已經滿人')
	} else {
		const updates = {
			[`rooms/${inviteCode}/full`]: true,
			[`rooms/${inviteCode}/player`]: request.auth.uid,
			['userRooms/' + userUid]: inviteCode,
		}
		await realtimeDB.ref().update(updates)
		logger.log('成功進入房間')
		return {}
	}
})
export const deleteRoom = onValueDeleted(
	{ ref: '/userRooms/{uid}', region: 'asia-southeast1' },
	async (event) => {
		const uid = event.params.uid
		logger.log(uid, '節點，在userRooms中偵測到更新')
		if (!event.data.val()) {
			logger.log(uid, '節點，資料不存在，可能已經刪除')
			return null
		}
		const roomId = event.data.val()
		const roomIdsRoomIdRef = realtimeDB.ref('roomIds/' + roomId)
		const roomIdsRoomIdSnap = await roomIdsRoomIdRef.get()
		if (!roomIdsRoomIdSnap.exists()) {
			logger.log(uid, '第二離開房間的用戶，房間相關資料已經刪除')
			return null
		} else {
			/* 這時會有個問題，就是另外一個玩家在userRooms中的資料，不會直接在此時刪除，而是第二個玩家的客戶端會在該房間刪除後，讓其刪除userRooms中該玩家的資料，因為可在客戶端上刪除資料，且可能透過特殊方式保留其資料，所以在規則上要避免根據userRooms的資料，去進行影響遊戲的操作，一般來說userRooms就是確認玩家是否已在遊戲的根據，也不能寫入只能刪除，如果玩家自己故意保留，也只是不能建立或參與遊戲而已。 */
			const updates = {
				['rooms/' + roomId]: null,
				['roomIds/' + roomId]: null,
				['userRooms/' + uid]: null,
			}
			await realtimeDB.ref().update(updates)
			logger.log(`已刪除${roomId}房間相關資訊`)
			return null
		}
	},
)
const getRandomInt1to10 = () => {
	/* 製造一個1-10的數組 */
	const winningRateList = []
	for (let i = 1; i <= 10; i++) {
		winningRateList.push(i)
	}
	/* 計算TypedArray能產生的數字範圍，能整除10的最大數字 */
	const divisibleValue = Math.floor(256 / winningRateList.length) * winningRateList.length

	/* 先宣告最後產生的結果數組 */
	let result = []
	/* 當結果數量到達1，才停止，製造偽隨機數 */
	while (result.length < 1) {
		/* 製造隨機數列，長度為距離最終需要的結果數量*2，數列要產生的數字比結果數量多，因為需要排除超過divisibleValue的數字，有機率會不夠用 */
		const randomValues = new Uint8Array((1 - result.length) * 2)
		webcrypto.getRandomValues(randomValues)
		/* 將產生的隨機數列比較是否大於divisibleValue，如果沒有大於就放入最終結果數列，到達結果數列所需數量，或是已經迭代比較這輪所有的隨機數字就停止，後者的狀況會在進行外圈的迭代 */
		for (let i = 0; i < randomValues.length && result.length < 1; i++) {
			if (randomValues[i] < divisibleValue) {
				result.push((randomValues[i] % winningRateList.length) + 1)
			}
		}
	}
	return result[0]
}
export const makeLotteryResult = onCall({ region: 'asia-southeast1' }, async (request) => {
	/* 沒登入不能使用該函數 */
	if (!request.auth) {
		logger.warn('使用者沒登入，嘗試呼叫摸彩函數')
		throw new HttpsError('unauthenticated', '請先登入')
	}
	const userUid = request.auth.uid
	const userRoomsUidRef = realtimeDB.ref('userRooms/' + userUid)
	const userRoomsUidSnap = await userRoomsUidRef.get()
	let roomId
	if (userRoomsUidSnap.exists()) {
		roomId = userRoomsUidSnap.val()
	} else {
		logger.warn('使用者不在任何房間，卻呼叫摸彩函數')
		throw new HttpsError('failed-precondition', '遊戲前請進入房間')
	}
	const roomOwnerRef = realtimeDB.ref(`rooms/${roomId}/roomOwner`)
	const roomOwnerSnap = await roomOwnerRef.get()
	if (roomOwnerSnap.val() !== userUid) {
		logger.warn(userUid + '非房主嘗試摸彩')
		throw new HttpsError('failed-precondition', '非房主不能啟動摸彩')
	}
	const winningRateRef = realtimeDB.ref(`rooms/${roomId}/winningRate`)
	const winningRateSnap = await winningRateRef.get()
	if (!winningRateSnap.exists()) {
		logger.warn('未找到中獎機率資料')
		throw new HttpsError('failed-precondition', '遊戲出現問題，請稍後再試')
	}
	const randomValue = getRandomInt1to10()
	let lotteryResult
	if (randomValue <= winningRateSnap.val()) {
		lotteryResult = true
	} else {
		lotteryResult = false
	}
	const lotteryResultRef = realtimeDB.ref(`rooms/${roomId}/lotteryResult`)
	await lotteryResultRef.set(lotteryResult)
	return {
		lotteryResult: lotteryResult,
	}
})

export const getRoomerTemplatesList = onCall({ region: 'asia-southeast1' }, async (request) => {
	/* 沒登入不能使用該函數 */
	if (!request.auth) {
		logger.warn('使用者沒登入，嘗試得到房主資訊')
		throw new HttpsError('unauthenticated', '請先登入')
	}
	const userUid = request.auth.uid
	const userRoomsUidRef = realtimeDB.ref('userRooms/' + userUid)
	const userRoomsUidSnap = await userRoomsUidRef.get()
	if (!userRoomsUidSnap.exists()) {
		logger.warn('使用者尚未進入房間，卻嘗試得到房主模板')
		throw new HttpsError('failed-precondition', '尚未參加遊戲')
	}
	const roomId = userRoomsUidSnap.val()
	const roomOwnerRef = realtimeDB.ref(`rooms/${roomId}/roomOwner`)
	const roomOwnerSnap = await roomOwnerRef.get()
	if (!roomOwnerSnap.exists()) {
		logger.warn(roomId + '該房間沒有房主資料')
		throw new HttpsError('failed-precondition', '無法讀取房主的模板')
	}
	const roomOwner = roomOwnerSnap.val()
	const usersUidRef = firestoreDB.collection('users').doc(roomOwner)
	let docSnap = await usersUidRef.get()
	let tries = 2
	logger.warn(`${docSnap.exists}test`)
	while (!docSnap.exists && tries <= 10) {
		await new Promise((resolve) => setTimeout(resolve, 1000))
		docSnap = await usersUidRef.get()
		tries++
	}
	if (!docSnap.exists && tries > 10) {
		logger.warn('已經讀取十次，都無法得到房主資料')
		throw new HttpsError('resource-exhausted', '系統忙碌或發生錯誤，請稍後再試')
	}
	return docSnap.data().templates
})
