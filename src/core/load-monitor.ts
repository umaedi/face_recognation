/**
 * Utilitas untuk memonitor beban kerja AI secara real-time pada instance ini.
 * Membantu API memutuskan apakah akan memproses secara lokal (Sync)
 * atau melempar ke worker (Async).
 */
export class LoadMonitor {
  private static activeAITasks = 0;
  
  // Ambang batas jumlah proses AI bersamaan di satu instance API
  // Dinaikkan ke 8 karena CPU server sangat kuat (64 Core)
  private static readonly BUSY_THRESHOLD = 6;

  /**
   * Menambah jumlah tugas AI yang sedang berjalan
   */
  static startTask() {
    this.activeAITasks++;
  }

  /**
   * Mengurangi jumlah tugas AI setelah selesai
   */
  static endTask() {
    this.activeAITasks = Math.max(0, this.activeAITasks - 1);
  }

  /**
   * Cek apakah server sedang sibuk
   */
  static isBusy(): boolean {
    return this.activeAITasks >= this.BUSY_THRESHOLD;
  }

  /**
   * Mendapatkan angka beban saat ini
   */
  static getCurrentLoad() {
    return this.activeAITasks;
  }
}
