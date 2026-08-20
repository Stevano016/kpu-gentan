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
                $this->line("  [no_urut: {$noUrut}] {$csvNama}:");
                $this->line("    NIK: {$dbVoter->nik} -> {$csvNik}");
                $updateData['nik'] = $csvNik;
                $needsUpdate = true;
                $updatedNikCount++;
            }

            // Compare NIK Sintetis
            $dbNikSintetis = (bool) $dbVoter->nik_sintetis;
            if ($dbNikSintetis !== $csvNikSintetis) {
                if (!isset($updateData['nik'])) {
                    $this->line("  [no_urut: {$noUrut}] {$csvNama}:");
                }
                $this->line("    NIK Sintetis: " . ($dbNikSintetis ? 'true' : 'false') . " -> " . ($csvNikSintetis ? 'true' : 'false'));
                $updateData['nik_sintetis'] = $csvNikSintetis ? 1 : 0;
                $needsUpdate = true;
            }

            // Compare NKK
            if ($dbVoter->nkk !== $csvNkk) {
                if (!isset($updateData['nik']) && !isset($updateData['nik_sintetis'])) {
                    $this->line("  [no_urut: {$noUrut}] {$csvNama}:");
                }
                $this->line("    NKK: " . ($dbVoter->nkk ?: 'NULL') . " -> " . ($csvNkk ?: 'NULL'));
                $updateData['nkk'] = $csvNkk;
                $needsUpdate = true;
                $updatedNkkCount++;
            }

            // Compare NKK Sintetis
            $dbNkkSintetis = (bool) $dbVoter->nkk_sintetis;
            if ($dbNkkSintetis !== $csvNkkSintetis) {
                if (!isset($updateData['nik']) && !isset($updateData['nik_sintetis']) && !isset($updateData['nkk'])) {
                    $this->line("  [no_urut: {$noUrut}] {$csvNama}:");
                }
                $this->line("    NKK Sintetis: " . ($dbNkkSintetis ? 'true' : 'false') . " -> " . ($csvNkkSintetis ? 'true' : 'false'));
                $updateData['nkk_sintetis'] = $csvNkkSintetis ? 1 : 0;
                $needsUpdate = true;
            }

            // Compare Catatan Impor
            if ($dbVoter->catatan_impor !== $csvCatatanImpor) {
                if (!isset($updateData['nik']) && !isset($updateData['nik_sintetis']) && !isset($updateData['nkk']) && !isset($updateData['nkk_sintetis'])) {
                    $this->line("  [no_urut: {$noUrut}] {$csvNama}:");
                }
                $this->line("    Catatan Impor: '" . ($dbVoter->catatan_impor ?: '') . "' -> '" . ($csvCatatanImpor ?: '') . "'");
                $updateData['catatan_impor'] = $csvCatatanImpor;
                $needsUpdate = true;
            }

            if ($needsUpdate) {
                $updatedRecords++;
                if (!$dryRun) {
                    DB::table('dpt')->where('no_urut', $noUrut)->update($updateData);
                }
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
