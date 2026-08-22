/// Hasil operasi repositori: berhasil dengan data, atau gagal dengan pesan
/// yang sudah siap ditampilkan ke petugas.
class Result<T> {
  const Result.success(this.data, [this.message])
      : isSuccess = true;

  const Result.failure(this.message)
      : data = null,
        isSuccess = false;

  final bool isSuccess;
  final T? data;
  final String? message;

  bool get isFailure => !isSuccess;
}
