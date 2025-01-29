/* 設置一個function當作製作Path2d物件的語法sugar */
/* ...args對照 =[offsetX,offsetY,ang,flipX,scale] */
export function createPathObj(fuc, r, ...args) {
	const pathObj = new Path2D()
	fuc(pathObj, r)
	const matrix = new DOMMatrix()
	if (args[0]) {
		matrix.e = args[0]
	}
	if (args[1]) {
		matrix.f = args[1]
	}
	if (args[2]) {
		const rad = (args[2] * Math.PI) / 180
		const cos = Math.cos(rad).toFixed(3)
		const sin = Math.sin(rad).toFixed(3)

		matrix.a = cos
		matrix.b = sin
		matrix.c = -sin
		matrix.d = cos
	}
	/* 這裡的矩陣是先旋轉在縮放 */
	if (args[2] && args[3]) {
		matrix.a = -matrix.a
		matrix.c = -matrix.c
	} else if (args[3]) {
		matrix.a = -matrix.a
	}
	if (args[4]) {
		matrix.a = args[4]
		matrix.d = args[4]
	}
	const newPathObj = new Path2D()
	newPathObj.addPath(pathObj, matrix)
	return newPathObj
}
export function headAndUpperBody(path, r) {
	/* 設定頭中心為原點 */
	/* 製作頭的路徑 */
	path.arc(0, 0, r, 0, Math.PI * 2, true)

	/* 製作身體的路徑 */
	path.arc(0, r * 2, r, 0, Math.PI, true)
	path.lineTo(r, r * 2)
	path.rect(-r, r * 2, r * 2, r * 4)
}
export function underBody(path, r) {
	/* 設定近端腳左上角為原點 */
	/* 製作近端的腳的路徑 */
	path.rect(0, 0, (r * 3) / 5, r * 2)

	/* 製作遠端的腳的路徑 */
	path.rect((r * 4) / 5, 0, (r * 2) / 5, r * 2)
}
export function hand(path, r) {
	/* 近端手左上角為原點 */
	/* 製作近端的手的路徑 */
	path.rect(0, 0, (r * 12) / 5, (r * 2) / 5)
	path.arc((r * 12) / 5, (r * 1) / 5, (r * 2) / 5, 0, Math.PI * 2)

	/* 製作遠端的手的路徑 */
	path.rect((r * 2) / 5, (-r * 3) / 5, (r * 12) / 5, (r * 2) / 5)
	path.arc((r * 14) / 5, (-r * 2) / 5, (r * 2) / 5, 0, Math.PI * 2)
}
export function card(path, r) {
	/* 近端手左上角為原點 */
	/* 將近端和遠端的手心連結 */
	path.moveTo((r * 12) / 5, (r * 1) / 5)
	path.lineTo((r * 14) / 5, (-r * 2) / 5)
	path.lineTo(r * 5.63, r * 0.63)
	path.lineTo(r * 5.54, r * 1.34)
}
export function speakIcon(path, r) {
	/* 該路徑為原點右邊的一條短線 */
	path.moveTo((r * 4) / 5, 0)
	path.lineTo((r * 7) / 5, 0)
}
export function heart(path, r) {
	/* 原點為愛心的中間 */
	/* 若直接輸入基本radius，製作出來的畫面將是小心臟，需自行乘以倍數 */
	path.arc((-r * 2) / 5, (-r * 1) / 5, (r * 2) / 5, 0, Math.PI, true)
	path.bezierCurveTo((-r * 4) / 5, (r * 1) / 5, (-r * 2) / 5, (r * 2) / 5, 0, (r * 3) / 5)
	path.bezierCurveTo(
		(r * 2) / 5,
		(r * 2) / 5,
		(r * 4) / 5,
		(r * 1) / 5,
		(r * 4) / 5,
		(r * -1) / 5,
	)
	path.arc((r * 2) / 5, (r * -1) / 5, (r * 2) / 5, 0, Math.PI, true)
}
