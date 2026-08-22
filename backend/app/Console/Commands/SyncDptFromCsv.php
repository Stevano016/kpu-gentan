<?php

namespace App\Console\Commands;

use Illuminate\Console\Command;
use Illuminate\Support\Facades\DB;

class SyncDptFromCsv extends Command
{
    /**
     * The name and signature of the console command.
     *
     * @var string
     */
    protected $signature = 'dpt:sync-csv {--dry-run : Only show changes without saving to database}';

    /**
     * The console command description.
     *
     * @var string
     */
    protected $description = 'Sync NIK, NKK, synthetic status, and import notes from dpt_seed.csv into database';

    /**
     * Execute the console command.
     */
    public function handle()
    {
        $csvFile = database_path('seeders/dpt_seed.csv');
        if (!file_exists($csvFile)) {
            $this->error("CSV file not found at: {$csvFile}");
            return 1;
        }

        $dryRun = $this->option('dry-run');
        if ($dryRun) {
            $this->info("DRY RUN MODE: No database changes will be saved.");
        }

        $handle = fopen($csvFile, 'r');
        if ($handle === false) {
            $this->error("Failed to open CSV file.");
            return 1;
        }

        $header = fgetcsv($handle);
        $colMap = array_flip($header);

        $totalChecked = 0;
        $updatedNikCount = 0;
        $updatedNkkCount = 0;
        $updatedRecords = 0;

        $this->info("Reading CSV and checking database...");

        $rowsToUpdate = [];

        while (($row = fgetcsv($handle)) !== false) {
            $noUrut = isset($colMap['no_urut']) && $row[$colMap['no_urut']] !== '' ? intval($row[$colMap['no_urut']]) : null;
            if ($noUrut === null) {
                continue;
            }

            $csvNik = $row[$colMap['nik']];
            $csvNkk = $row[$colMap['nkk']] ?: null;
            $csvNikSintetis = $row[$colMap['nik_sintetis']] === '1';
            $csvNkkSintetis = $row[$colMap['nkk_sintetis']] === '1';
            $csvCatatanImpor = $row[$colMap['catatan_impor']] ?: null;
            $csvNama = $row[$colMap['nama']];

            // Fetch current voter in database by no_urut
            $dbVoter = DB::table('dpt')->where('no_urut', $noUrut)->first();

            if (!$dbVoter) {
                $this->warn("Voter with no_urut {$noUrut} ({$csvNama}) not found in database.");
                continue;
            }

            $totalChecked++;
            $needsUpdate = false;
            $updateData = [];

            // Compare NIK
            if ($dbVoter->nik !== $csvNik) {
                $updateData['nik'] = $csvNik;
                $needsUpdate = true;
                $updatedNikCount++;
            }

            // Compare NIK Sintetis
            $dbNikSintetis = (bool) $dbVoter->nik_sintetis;
            if ($dbNikSintetis !== $csvNikSintetis) {
                $updateData['nik_sintetis'] = $csvNikSintetis ? 1 : 0;
                $needsUpdate = true;
            }

            // Compare NKK
            if ($dbVoter->nkk !== $csvNkk) {
                $updateData['nkk'] = $csvNkk;
                $needsUpdate = true;
                $updatedNkkCount++;
            }

            // Compare NKK Sintetis
            $dbNkkSintetis = (bool) $dbVoter->nkk_sintetis;
            if ($dbNkkSintetis !== $csvNkkSintetis) {
                $updateData['nkk_sintetis'] = $csvNkkSintetis ? 1 : 0;
                $needsUpdate = true;
            }

            // Compare Catatan Impor
            if ($dbVoter->catatan_impor !== $csvCatatanImpor) {
                $updateData['catatan_impor'] = $csvCatatanImpor;
                $needsUpdate = true;
            }

            if ($needsUpdate) {
                $updatedRecords++;
                $rowsToUpdate[] = [
                    'no_urut' => $noUrut,
                    'nama' => $csvNama,
                    'current_nik' => $dbVoter->nik,
                    'new_nik' => $csvNik,
                    'update_data' => $updateData,
                    'db_voter' => $dbVoter,
                ];
            }
        }

        // Pass 1: For any row where NIK is changing, temporarily update the NIK to a unique temporary NIK.
        // This prevents integrity constraint violations when NIKs are swapped/freed.
        if (!$dryRun && count($rowsToUpdate) > 0) {
            foreach ($rowsToUpdate as $item) {
                if (isset($item['update_data']['nik'])) {
                    $tempNik = '999999' . sprintf('%010d', $item['no_urut']);
                    DB::table('dpt')->where('no_urut', $item['no_urut'])->update(['nik' => $tempNik]);
                }
            }
        }

        // Pass 2: Apply the final changes and print output.
        foreach ($rowsToUpdate as $item) {
            $noUrut = $item['no_urut'];
            $csvNama = $item['nama'];
            $updateData = $item['update_data'];
            $dbVoter = $item['db_voter'];

            $this->line("  [no_urut: {$noUrut}] {$csvNama}:");
            
            if (isset($updateData['nik'])) {
                $this->line("    NIK: {$dbVoter->nik} -> {$updateData['nik']}");
            }
            if (isset($updateData['nik_sintetis'])) {
                $dbNikSintetis = (bool) $dbVoter->nik_sintetis;
                $csvNikSintetis = $updateData['nik_sintetis'] === 1;
                $this->line("    NIK Sintetis: " . ($dbNikSintetis ? 'true' : 'false') . " -> " . ($csvNikSintetis ? 'true' : 'false'));
            }
            if (isset($updateData['nkk'])) {
                $this->line("    NKK: " . ($dbVoter->nkk ?: 'NULL') . " -> " . ($updateData['nkk'] ?: 'NULL'));
            }
            if (isset($updateData['nkk_sintetis'])) {
                $dbNkkSintetis = (bool) $dbVoter->nkk_sintetis;
                $csvNkkSintetis = $updateData['nkk_sintetis'] === 1;
                $this->line("    NKK Sintetis: " . ($dbNkkSintetis ? 'true' : 'false') . " -> " . ($csvNkkSintetis ? 'true' : 'false'));
            }
            if (isset($updateData['catatan_impor'])) {
                $this->line("    Catatan Impor: '" . ($dbVoter->catatan_impor ?: '') . "' -> '" . ($csvCatatanImpor ?: '') . "'");
            }

            if (!$dryRun) {
                DB::table('dpt')->where('no_urut', $noUrut)->update($updateData);
            }
        }

        fclose($handle);

        $this->info("\nSynchronization Complete!");
        $this->info("Total checked: {$totalChecked}");
        $this->info("Records with changes: {$updatedRecords}");
        $this->info("NIKs updated: {$updatedNikCount}");
        $this->info("NKKs updated: {$updatedNkkCount}");

        return 0;
    }
}
