import 'dotenv/config';
import * as fs from 'fs';
import { spawn } from 'child_process';
import { AVAILABLE_MODELS } from '../../../src/utils/model-factory.js';
import * as path from 'path';
import { fileURLToPath } from 'url';

// ==========================================
// User Configuration
// ==========================================
const GENERATION_COUNT = 1000; // n: 各実験での生成数
const MAX_CONCURRENT_JOBS = 4; // 同時に実行する実験プロセス数
const MOCK_MODE = false; // Use mock mode for testing

// Script Implementation
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const RUN_EXPERIMENT_SCRIPT = path.join(__dirname, 'run_experiment.ts');
const LOG_DIR = path.resolve(__dirname, '../../../experiments/logs'); // ログ保存先

// 実験対象のモデルリスト
const TARGET_MODELS = [
//   AVAILABLE_MODELS.GEMINI_3_FLASH,
//   AVAILABLE_MODELS.GEMINI_3_PRO,
  AVAILABLE_MODELS.GPT_5_2,
  AVAILABLE_MODELS.GPT_5_MINI
];

// ==========================================
// Script Implementation
// ==========================================

interface ExperimentJob {
    model: string;
    rag: boolean;
    status: 'pending' | 'running' | 'completed' | 'failed';
}

// ログディレクトリの作成
if (!fs.existsSync(LOG_DIR)) {
    fs.mkdirSync(LOG_DIR, { recursive: true });
}

async function runCommand(cmd: string, args: string[], prefix: string, logFile: string): Promise<void> {
    return new Promise((resolve, reject) => {
        console.log(`[${prefix}] Starting... (Log: ${logFile})`);
        
        const logStream = fs.createWriteStream(logFile, { flags: 'a' });
        
        const proc = spawn(cmd, args, {
            stdio: ['ignore', 'pipe', 'pipe'], 
            env: { 
                ...process.env, 
                FORCE_COLOR: 'true',
                NODE_OPTIONS: '--max-old-space-size=8192' // 8GB Memory Limit per process
            } 
        });

        // パイプ処理: ファイルに書き込みつつ、重要な情報だけコンソールに出すことも可能だが
        // 今回はシンプルに全出力をファイルへ、エラーだけコンソールにも出す
        
        proc.stdout.pipe(logStream);
        proc.stderr.pipe(logStream);

        // エラーだけはコンソールにもチラ見せする（デバッグ用）
        proc.stderr.on('data', (data) => {
             // 致命的なエラーっぽいものだけ出すなどのフィルタリングも可能
        });

        proc.on('close', (code) => {
            logStream.end();
            if (code === 0) {
                console.log(`[${prefix}] ✅ Completed successfully.`);
                resolve();
            } else {
                console.error(`[${prefix}] ❌ Failed with exit code ${code}. Check log for details.`);
                reject(new Error(`Exit code ${code}`));
            }
        });

        proc.on('error', (err) => {
            console.error(`[${prefix}] ❌ Process error:`, err);
            logStream.end();
            reject(err);
        });
    });
}

async function main() {
    console.log(`🚀 Batch Experiment Runner Started`);
    console.log(`   Count per experiment (n): ${GENERATION_COUNT}`);
    console.log(`   Max concurrent jobs: ${MAX_CONCURRENT_JOBS}`);
    console.log(`   Log Directory: ${LOG_DIR}`);
    console.log(`   Models (${TARGET_MODELS.length}):`);
    TARGET_MODELS.forEach(m => console.log(`    - ${m}`));
    console.log('---------------------------------------------------\n');

    // ジョブキューの作成
    const jobs: ExperimentJob[] = [];
    for (const model of TARGET_MODELS) {
        jobs.push({ model, rag: true, status: 'pending' });
        jobs.push({ model, rag: false, status: 'pending' });
    }

    let activeJobs = 0;
    let completedJobs = 0;
    let failedJobs = 0;
    const totalJobs = jobs.length;

    const executeNext = async (): Promise<void> => {
        if (activeJobs >= MAX_CONCURRENT_JOBS) return;

        const nextJobIndex = jobs.findIndex(j => j.status === 'pending');
        if (nextJobIndex === -1) return; 

        const job = jobs[nextJobIndex];
        job.status = 'running';
        activeJobs++;

        // ファイル名に使える形式へ整形
        const safeModelName = job.model.replace(/[:/]/g, '_');
        const jobId = `${safeModelName}_${job.rag ? 'RAG_ON' : 'RAG_OFF'}`;
        const prefix = jobId.substring(0, 30).padEnd(30);
        const logFile = path.join(LOG_DIR, `${jobId}.log`);

        if (activeJobs < MAX_CONCURRENT_JOBS) {
            executeNext();
        }

        try {
            await runCommand('npx', [
                'tsx', 
                RUN_EXPERIMENT_SCRIPT,
                '--count', GENERATION_COUNT.toString(),
                '--rag', job.rag ? 'on' : 'off',
                '--model', job.model,
                '--mock', MOCK_MODE.toString()
            ], prefix, logFile);
            
            job.status = 'completed';
            completedJobs++;
        } catch (error) {
            job.status = 'failed';
            failedJobs++;
        } finally {
            activeJobs--;
            executeNext();
        }
    };

    const starters = Array(Math.min(MAX_CONCURRENT_JOBS, jobs.length)).fill(null).map(() => executeNext());
    
    await new Promise<void>((resolve) => {
        const interval = setInterval(() => {
            const pending = jobs.filter(j => j.status === 'pending').length;
            const running = jobs.filter(j => j.status === 'running').length;
            
            // 進捗状況を1行で上書き表示 (簡易的なプログレスバー)
            process.stdout.write(`\rProgress: [Success: ${completedJobs} | Failed: ${failedJobs} | Running: ${running} | Pending: ${pending}]`);

            if (pending === 0 && running === 0) {
                clearInterval(interval);
                process.stdout.write('\n'); // 改行
                resolve();
            }
        }, 1000);
    });

    console.log('\n===================================================');
    console.log(`🎉 All Experiments Finished.`);
    console.log(`   Total: ${totalJobs}, Success: ${completedJobs}, Failed: ${failedJobs}`);
    console.log(`   Logs are saved in: ${LOG_DIR}`);
    console.log('===================================================');
}

main().catch(console.error);
