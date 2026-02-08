---
theme: ./theme
title: 卒業論文発表
backgroundColor: '#ffffff'
class: "bg-white"
info: |
  東京理科大学 創域理工学部 情報計算科学科
  6322087 三笠 悠太郎
transition: slide-left
mdc: true
colorSchema: light
themeconfig:
  primary: '#003366'
  text: '#000000'
---

<h1 class=" text-4xl! font-bold leading-tight">一点物売買プラットフォームの動作検証を目的とした<br>社会的シナリオに則ったデータ生成エージェントの開発</h1>

<div class="grid grid-cols-[1fr_auto] gap-4 pt-12 items-end">
  <div>
    <p class="text-sm mt-4">2026/02/09</p>
    <br>
    <p class="text-lg">指導教員: 植松 幸生 准教授</p>
    <br>
    <p class="text-lg">東京理科大学 創域理工学部 情報計算科学科</p>
    <p class="text-lg">6322087 三笠 悠太郎</p>
  </div>
  <div class="flex flex-col items-center opacity-80 mr-24">
    <img src="/figure/presentation-qr.png" class="h-64 w-auto object-contain" />
    <span class="text-[10px] text-gray-500">発表資料 (https://yuutaro.github.io/graduation-thesis-presentation/)</span>
  </div>
</div>

<!--
三笠悠太郎です。
「一点物売買プラットフォームの動作検証を目的とした社会的シナリオに則ったデータ生成エージェントの開発」という題目で発表させていただきます。
よろしくお願いいたします。
-->

---

# 1. 背景: クリエイターエコノミーと「社会的シナリオ」

<div class="grid grid-cols-[1.3fr_1fr] gap-6 mt-4">
  <div class="text-xl">
    <ul class="space-y-4">
      <li><strong>クリエイターエコノミーの拡大</strong>
        <ul class="pl-4 mt-1 list-disc opacity-80 text-base">
          <li>個人が創作物を発信・販売する市場（BOOTH, minne等）。</li>
          <li>物理的な作品（フィギュア、工芸品）の流通も活発化。</li>
        </ul>
      </li>
      <li><strong>既存プラットフォームの課題</strong>
        <ul class="pl-4 mt-1 list-disc opacity-80 text-base space-y-1">
          <li><strong>「商品」としての扱い</strong>: スペックと価格が重視されがち。</li>
          <li><strong>社会的シナリオの欠落</strong>: 「なぜ作ったか」「どんなコミュニティで生まれたか」という<strong>シナリオ</strong>が保存されない。</li>
          <li><strong>複雑な権利関係</strong>: 共同制作やイベント主催者への収益分配など、複雑な関係性をシステムで表現しきれていない。</li>
        </ul>
      </li>
    </ul>
    <div class="mt-6 font-bold text-blue-700 text-xl">
      → 「作品の社会的シナリオ」や「社会的関係性」を保存できるCtoC基盤が必要
    </div>
  </div>
  <div class="flex flex-col gap-3">
    <div>
      <div class="text-sm mb-1 text-gray-500">BASEにて制作されたからくり細工を販売するショップ</div>
      <img src="/figure/base-example.png" class="h-36 w-full object-cover object-top rounded shadow border border-gray-200" />
      <div class="text-[8px] text-gray-400 mt-1 truncate">出典: https://oishiiosushi.thebase.in/</div>
    </div>
    <div>
      <div class="text-sm mb-1 text-gray-500">メルカリに出品されるハンドメイドのアクセサリー</div>
      <img src="/figure/mercari-example.png" class="h-36 w-full object-cover object-top rounded shadow border border-gray-200" />
      <div class="text-[8px] text-gray-400 mt-1 truncate">出典: https://jp.mercari.com/user/profile/927250367</div>
    </div>
  </div>
</div>

<!--
まず、研究の背景についてお話しします。
近年、クリエイターエコノミーの拡大に伴い、個人が自身の創作物を発信・販売する市場が急速に成長しています。特に、フィギュアや工芸品といった物理的な一点物作品の流通も活発化しています。

しかし、既存のプラットフォームには課題があります。
多くの場合、作品はスペックや価格のみで比較される「商品」として扱われがちです。
一点物作品において本来価値の源泉となる、「なぜ作ったのか」「どのようなコミュニティで生まれたのか」といった「社会的シナリオ」が、システム上で十分に保存・表現されていないのが現状です。
また、共同制作やイベント運営など、クリエイター間の複雑な社会的関係性や収益分配をサポートする機能も不足しています。

そこで、作品の「社会的シナリオ」や「社会的関係性」を構造化して保存できる、新しいプラットフォームが必要とされています。
-->

---

# 2. 課題: 1点物プラットフォームの検証データ

**1点物 (One-of-a-kind)** の価値は、スペックではなく「社会的シナリオ（背景情報）」にある。
しかし、既存のテストデータ生成手法では、この「シナリオ」を再現できない。

<div class="grid grid-cols-2 gap-8 mt-6">
  <div>
    <h3 class="font-bold text-red-700 mb-2">既存手法の限界</h3>
    <ul class="list-disc pl-4 space-y-3 text-sm">
      <li><strong>ランダム生成 (Faker.js等)</strong>
        <p class="opacity-80 text-xs mt-1">「AさんがBさんの作品を売る」等の<strong>論理的矛盾</strong>が頻発し、1点物の権利関係を検証できない。</p>
      </li>
      <li><strong>ダミーテキスト (Lorem Ipsum)</strong>
        <p class="opacity-80 text-xs mt-1">意味を持たないため、シナリオに基づく検索やレコメンデーションの精度検証が不可能。</p>
      </li>
    </ul>
  </div>
  <div class="bg-gray-50 p-4 rounded border border-gray-200">
    <h3 class="font-bold text-blue-700 mb-2">本研究の課題</h3>
    <p class="text-sm leading-relaxed">
      1点物プラットフォームの動作検証には、<br>
      <strong>「矛盾のない社会的シナリオ」</strong> を持った<br>
      大量のテストデータが必要である。
    </p>
  </div>
</div>

<!--
しかし、「社会的シナリオ」を重視する1点物プラットフォームの開発には、大きな壁があります。それは「検証用のテストデータが存在しない」という問題です。

1点物の価値はスペックではなく、その背景にあるシナリオに依存します。
しかし、Faker.jsなどの従来のランダム生成手法では、「部外者が他人の作品を管理している」といった論理的矛盾が頻発し、複雑な権利関係を検証できません。また、「Lorem Ipsum」のような無意味なテキストでは、シナリオに基づく検索やレコメンデーションの精度を検証することが不可能です。

さらに、これは新規開発であるため、学習元となる過去のデータも存在しません。
つまり、矛盾のない「社会的シナリオ」を持ったデータを、自動で大量に生成する手法が求められています。
-->

---

# 3. 目的

<div class="bg-gradient-to-r from-blue-700 to-indigo-800 text-white p-6 rounded-xl shadow-lg mb-8 relative overflow-hidden">
  <!-- <div class="absolute top-0 right-0 p-4 opacity-10 text-6xl font-bold leading-none transform translate-x-4 -translate-y-4">GOAL</div> -->
  <div class="text-xl font-bold leading-relaxed relative z-10">
    <span class="border-b-2 border-blue-400 pb-1">社会的シナリオに基づくデータ生成エージェント</span> を開発し、<br>
    1点物売買プラットフォームの <span class="text-yellow-300 font-extrabold">動作検証（検索・整合性）</span> を行う。
  </div>
</div>

<div class="space-y-4">
  <div class="bg-white p-4 rounded-lg border-l-4 border-blue-500 shadow-sm">
    <h3 class="font-bold text-blue-800 text-lg mb-2 flex items-center gap-2">
      なぜエージェントが必要か？
    </h3>
    <ul class="list-disc pl-5 text-gray-700 text-sm">
      <li>1点物の価値である「シナリオ」は、従来手法では生成不可能。</li>
      <li>LLMを用いることで、矛盾のない<strong>「社会的シナリオ」</strong>を大量生成する。</li>
    </ul>
  </div>

  <div class="bg-gray-50 p-4 rounded-lg border border-gray-200 text-xs opacity-90">
    <strong class="text-gray-600 block mb-1">※ 検証環境（プラットフォーム）</strong>
    本研究では、提案手法の有効性を検証するためのテストベッドとして、「複雑な権利関係を持つCtoCプラットフォーム」を実際に構築・利用する。
  </div>
</div>

<!--
そこで本研究の目的は、「社会的シナリオに基づくデータ生成エージェント」を開発し、1点物売買プラットフォームの動作検証を行うことです。

なぜエージェントが必要かというと、1点物の核心である「シナリオ」は従来の手法では生成できないからです。
本研究ではLLMを用いることで、矛盾のない「社会的シナリオ」を大量に生成し、検索精度やシステムの整合性を検証します。

検証の場として、複雑な権利関係を持つプラットフォーム自体も実際に構築し、これをテストベッドとして使用しました。
-->

---

# 4. 提案手法: 社会的シナリオに基づくデータ生成

直接データを生成するのではなく、社会的シナリオを経由することで整合性を担保する。

<div class="grid grid-cols-[1fr_30px_1fr] gap-4 mt-6 items-start">
  <!-- Left Column: Social Scenario -->
  <div class="bg-blue-50 p-4 rounded-lg border border-blue-200 h-full flex flex-col">
    <h3 class="text-blue-800 font-bold text-lg mb-1">社会的シナリオ</h3>
        <div class="flex-grow">
      <p class="text-sm font-bold text-gray-700 mb-2">自然言語による背景記述</p>
      <ul class="list-disc pl-4 text-xs space-y-1 mb-4 text-gray-600">
        <li>ユーザーの動機、人間関係、活動の経緯。</li>
        <li>なぜその作品が生まれたかという因果関係。</li>
      </ul>
    </div>
    <div class="bg-white p-3 rounded border border-blue-100 text-xs text-gray-700 shadow-sm">
      <strong class="block text-blue-600 mb-1 border-b border-blue-100 pb-1">Example</strong>
      「美大生の<strong>A</strong>は、廃材を用いた<strong>楽器製作サークル</strong>を立ち上げた。最初の作品として、<strong>壊れたラジオを使ったシンセサイザー</strong>を制作した。」
    </div>
  </div>

  <!-- Arrow -->
  <div class="flex justify-center items-center h-full text-3xl text-gray-300">
    <carbon:arrow-right />
  </div>

  <!-- Right Column: Structured Data -->
  <div class="bg-green-50 p-4 rounded-lg border border-green-200 h-full flex flex-col">
    <h3 class="text-green-800 font-bold text-lg mb-1">構造化データ</h3>
    <div class="flex-grow">
      <p class="text-sm font-bold text-gray-700 mb-2">DBレコード群への変換</p>
      <ul class="list-disc pl-4 text-xs space-y-1 mb-4 text-gray-600">
        <li>スキーマ (User, Project, Item) に従った実データ。</li>
        <li>シナリオに基づきリレーションが構築される。</li>
      </ul>
    </div>
    <div class="bg-white p-3 rounded border border-green-100 text-[10px] font-mono text-gray-700 shadow-sm space-y-1">
      <strong class="block text-green-600 mb-1 border-b border-green-100 pb-1 text-xs sans-serif">Example</strong>
      <div class="flex gap-2">
        <span class="text-green-700">User:</span> <span>{ name: "A", role: "Student" }</span>
      </div>
      <div class="flex justify-center text-gray-400 text-xs">↓ <span class="italic">Owner of</span></div>
      <div class="flex gap-2">
        <span class="text-green-700">Project:</span> <span>{ title: "Scrap Inst. Circle" }</span>
      </div>
      <div class="flex justify-center text-gray-400 text-xs">↓ <span class="italic">Has Item</span></div>
      <div class="flex gap-2">
        <span class="text-green-700">Item:</span> <span>{ title: "Radio Synth" }</span>
      </div>
    </div>
  </div>
</div>

<!--
提案手法の概念モデルです。
本研究では、データベースのレコードを直接生成するのではなく、中間に「社会的シナリオ」という層を設けています。

左側の「社会的シナリオ」は、自然言語で記述された物語です。
例えば、「美大生のAがサークルを作り、ラジオシンセを制作した」といったように、動機や経緯などの文脈情報が含まれます。

これを右側の「構造化データ」へ変換します。
シナリオに基づいて、User、Project、Itemといったレコードが生成され、それらの間に正しいリレーションが結ばれます。
このプロセスにより、データの整合性が保たれ、論理的な矛盾のないテストデータが生成されます。
-->

---

# 5. データ生成プロセス

<!-- 抽象的な着想を、具体的なDBレコードへ変換するパイプライン -->
人間が定義したカテゴリと人物タイプの分布をもとに、社会的シナリオを生成し、構造化データへと変換するエージェント

<div class="flex justify-center my-2">
  <img src="/figure/system-architecture.drawio.png" alt="Architecture" class="h-60 object-contain" />
</div>

<div class="grid grid-cols-3 gap-2 text-sm mt-2">
  <div class="bg-white p-2 rounded shadow-sm border border-gray-100">
    <strong class="text-blue-600 block mb-1 text-xl">Director (進行管理)</strong>
    <p class="opacity-80 text-[10px] leading-tight text-xl">カテゴリ・人物タイプに基づき、Scenaristに生成指示を出し、全体の生成数を管理する。</p>
  </div>
  <div class="bg-white p-2 rounded shadow-sm border border-gray-100">
    <strong class="text-blue-600 block mb-1 text-xl">Scenarist (社会的シナリオ生成)</strong>
    <p class="opacity-80 text-[10px] leading-tight text-xl">指示に基づき、具体的で整合性の取れたシナリオを作成する。</p>
  </div>
  <div class="bg-white p-2 rounded shadow-sm border border-gray-100">
    <strong class="text-blue-600 block mb-1 text-xl">Designer (構造化データ生成)</strong>
    <p class="opacity-80 text-[10px] leading-tight text-xl">シナリオに従い、具体的なデータベース用の構造化データ(JSON)を生成する。</p>
  </div>
</div>

<!--
具体的なデータ生成プロセスです。
このシステムは、抽象から具体への変換パイプラインとして機能します。

まず、Directorが生成の指示を出し、全体のバランスを管理します。
次に、Scenaristがその指示を受けて、具体的な社会的シナリオを作成します。
最後に、Designerがそのシナリオに従って、データベースに投入可能な構造化データを生成します。
-->

---

# 6. 記憶機構 (RAG): 社会的整合性の担保

現実社会における「差別化（住み分け）」を再現するため、過去の生成物を参照して重複を回避する。

<div class="grid grid-cols-3 gap-4 mt-8">
  <div class="bg-blue-50 p-4 rounded-lg border-t-4 border-blue-500 shadow-sm relative h-40">
    <div class="text-3xl mb-2 text-blue-500"><carbon:save /></div>
    <h3 class="font-bold text-blue-700 mb-1">1. 記憶 (Memory)</h3>
    <p class="text-xs text-gray-600 leading-tight">生成されたシナリオをベクトル化し、データベースに蓄積する。</p>
    <div class="absolute -right-3 top-1/2 transform -translate-y-1/2 text-gray-300 text-2xl z-10"><carbon:arrow-right /></div>
  </div>

  <div class="bg-indigo-50 p-4 rounded-lg border-t-4 border-indigo-500 shadow-sm relative h-40">
    <div class="text-3xl mb-2 text-indigo-500"><carbon:search /></div>
    <h3 class="font-bold text-indigo-700 mb-1">2. 検索 (Retrieval)</h3>
    <p class="text-xs text-gray-600 leading-tight">次の生成を行う前に、類似した過去のシナリオを検索する。</p>
    <div class="absolute -right-3 top-1/2 transform -translate-y-1/2 text-gray-300 text-2xl z-10"><carbon:arrow-right /></div>
  </div>

  <div class="bg-red-50 p-4 rounded-lg border-t-4 border-red-500 shadow-sm h-40">
    <div class="text-3xl mb-2 text-red-500"><carbon:direction-loop-right /></div>
    <h3 class="font-bold text-red-700 mb-1">3. 制約 (Constraint)</h3>
    <p class="text-xs text-gray-600 leading-tight">「これらとは重複しないシナリオで作れ」と指示し、重複を回避する。</p>
  </div>
</div>

<div class="mt-6 bg-gray-50 p-3 rounded-lg border border-dashed border-gray-300 flex flex-col gap-2">
  <div class="flex items-center gap-2">
    <div class="bg-white px-2 py-1 rounded border text-xs font-mono text-gray-500 shadow-sm">Context</div>
    <div class="text-xs text-gray-600">既存: 「A大学 手芸同好会」が存在</div>
  </div>
  <div class="flex items-center gap-2 text-sm">
    <span class="text-gray-500 line-through decoration-red-500 decoration-2">生成物: 「A大学 ハンドメイドサークル」</span>
    <span class="text-xs text-red-500 font-bold">✖ 矛盾 (学内重複)</span>
    <span class="text-gray-400">→</span>
    <strong class="text-blue-700">生成物: 「B大学 ハンドメイドサークル」</strong>
    <span class="ml-auto text-green-600 font-bold text-xs bg-green-50 px-2 py-1 rounded">✔ 採用</span>
  </div>
</div>

<!--
本システムの核となるのが、RAGを用いた記憶機構です。

通常、データ生成は1件ずつ独立して行われるため、「A大学手芸同好会」と「A大学ハンドメイドサークル」が重複して作られてしまうような矛盾が生じがちです。

本システムでは、過去の生成データを「記憶」として参照し、「A大学には既にサークルがあるから、B大学にするか、違う活動内容にしよう」といった「差別化」を行います。
これにより、現実社会のような多様性と住み分けを再現し、全体として矛盾のないデータを生成します。
-->

---

# 7.1. 検証環境: 開発したプラットフォーム

検証用テストベッドとして、実際にモダンなCtoCプラットフォームを開発・利用。


<div class="grid grid-cols-[1.1fr_0.9fr] gap-8 mt-2">
  <div>
    <h3 class="text-lg font-bold text-gray-700 mb-2 border-b-2 border-blue-500 inline-block">技術スタック</h3>
    <ul class="text-sm">
      <li class="flex items-start gap-2 rounded hover:bg-gray-50">
        <img src="/logo/nextjs-icon.svg" class="h-5 w-5 mt-0.5" />
        <div>
          <span class="font-bold text-gray-800">Next.js</span>
          <p class="text-[10px] text-gray-500 leading-tight　my-0! py-0!">モダンなUI/UXとSEOの両立。Server Components活用。</p>
        </div>
      </li>
      <li class="flex items-start gap-2 rounded hover:bg-gray-50">
        <img src="/logo/nestjs.svg" class="h-5 w-5 mt-0.5" />
        <div>
          <span class="font-bold text-gray-800">NestJS  (Prisma)</span>
          <p class="text-[10px] text-gray-500 leading-tight　my-0! py-0!">堅牢なバックエンド設計。モジュール構造による拡張性。</p>
        </div>
      </li>
      <li class="flex items-start gap-2 rounded hover:bg-gray-50">
        <img src="/logo/postgresql.svg" class="h-5 w-5 mt-0.5" />
        <div>
          <span class="font-bold text-gray-800">PostgreSQL</span>
          <p class="text-[10px] text-gray-500 leading-tight　my-0! py-0!">複雑なリレーションの整合性を厳密に管理。</p>
        </div>
      </li>
      <li class="flex items-start gap-2 rounded hover:bg-gray-50">
        <img src="/logo/stripe-connect.svg" class="h-5 w-auto mt-0.5" />
        <div>
          <span class="font-bold text-gray-800">Stripe Connect</span>
          <p class="text-[10px] text-gray-500 leading-tight　my-0! py-0!">CtoC特有の複雑な資金フロー（分割決済・預かり金）。</p>
        </div>
      </li>
    </ul>
  </div>
  <SystemArchitecture />
</div>

<div class="mt-4 pt-2 border-t border-gray-200">
  <h3 class="text-base font-bold text-gray-700 mb-2 border-b-2 border-green-500 inline-block">主な機能</h3>
  <div class="grid grid-cols-3 gap-3 text-xs">
    <div class="bg-green-50 p-2 rounded border border-green-100">
      <strong class="text-green-800 block mb-1">Project機能</strong>
      <p class="text-gray-600 leading-tight">招待制サークル、公募制コンテスト等の統治形態。</p>
    </div>
    <div class="bg-yellow-50 p-2 rounded border border-yellow-100">
      <strong class="text-yellow-800 block mb-1">高度な決済</strong>
      <p class="text-gray-600 leading-tight">オークション、抽選販売、収益分配 (Split Payment)。</p>
    </div>
    <div class="bg-blue-50 p-2 rounded border border-blue-100">
      <strong class="text-blue-800 block mb-1">統合検索</strong>
      <p class="text-gray-600 leading-tight">User, Item, Projectを横断するオムニサーチ。</p>
    </div>
  </div>
</div>
<!--
検証環境として開発したプラットフォームについて説明します。
技術スタックには、Next.js, NestJS, PostgreSQLを採用し、決済基盤にはStripe Connectを使用しています。

機能としては、招待制サークルや公募制コンテストを実現する「Project機能」、オークションや抽選販売、複雑な収益分配を行う「高度な決済機能」、そしてユーザー、作品、プロジェクトを横断して検索できる「統合検索機能」を実装しました。
-->

---

# 7.2. 実験環境: 生成対象となるデータモデル

データ生成エージェントは、以下の3つの主要エンティティとそのリレーションを「ひとまとまりのシナリオ」として生成する。

<div class="grid grid-cols-2 gap-4 mt-4 items-start">
  <div class="space-y-3 text-sm">
    <div class="bg-blue-50 p-2 rounded shadow-sm border border-blue-100">
      <strong class="text-blue-800 block mb-1">User</strong>
      <ul class="opacity-80 text-xs pl-4 list-disc leading-tight">
        <li>クリエイターとしてのアイデンティティ。</li>
        <li>プロフィール、活動履歴を持つ。</li>
      </ul>
    </div>
    <div class="bg-green-50 p-2 rounded shadow-sm border border-green-100">
      <strong class="text-green-800 block mb-1">Project</strong>
      <ul class="opacity-80 text-xs pl-4 list-disc leading-tight">
        <li>企画、イベント、サークル。</li>
        <li>Userが所有(Owner)し、参加(Collaborator)する。</li>
        <li>作品をまとめる「場」を提供する。</li>
      </ul>
    </div>
    <div class="bg-yellow-50 p-2 rounded shadow-sm border border-yellow-100">
      <strong class="text-yellow-800 block mb-1">Item</strong>
      <ul class="opacity-80 text-xs pl-4 list-disc leading-tight">
        <li>シナリオ（説明文）を持つ。</li>
        <li>Userによって作成され、Projectに紐づく。</li>
      </ul>
    </div>
  </div>
  <div class="flex items-center justify-center">
    <img src="/figure/User-Item-Project.drawio.png" alt="Model" class="h-auto max-h-[350px] object-contain shadow-md rounded" />
  </div>
</div>

<!--
データ生成エージェントが生成する対象のデータモデルです。

中心となるのが「User」で、クリエイターとしてのプロフィールを持ちます。
次に「Project」です。これは企画やサークルといった「社会的シナリオ」の舞台となるエンティティで、Userがオーナーとなったり、メンバーとして参加したりします。
そして「Item」です。これが作品や成果物を表し、詳細なシナリオを持ち、特定のProjectに紐づきます。

エージェントは、これら3つのエンティティと、その間の複雑なリレーションを、矛盾なくひとまとまりのセットとして生成します。
-->

---

# 8. 評価実験の設定

提案手法の有効性を検証するため、以下の4つの基盤モデルを用いて、それぞれ**RAG ON/OFF**の条件でシナリオ生成を行った。（各条件1000件）

- **gemini-3-pro-preview**
- **gemini-3-flash-preview**
- **gpt-5.2-2025-12-11**
- **gpt-5-mini-2025-12-11**

<br>

**比較項目**: 各モデルにおける **RAG ON (記憶参照あり)** と **RAG OFF (なし)** の差異。  
**仮説**: RAGによる記憶参照を行うことで、独立した生成プロセス間で発生しがちな全体的な矛盾（同じような組織の重複など）を回避し、社会的に自然な多様性を維持できる。

<!--
提案手法の有効性を検証するため、1000件のシナリオ連続生成実験を行いました。

基盤モデルとして、Gemini 3系列（Pro, Flash）とGPT-5系列（5.2, mini）の計4モデルを採用しました。
それぞれについて記憶機構（RAG）を「ONにした場合」と「OFFにした場合」で比較を行っています。

仮説として、RAGをONにすることで、単なる設定の重複だけでなく、個別の生成プロセスでは検知できない「全体としての矛盾（例えば同じようなサークルが乱立するなど）」を回避し、より社会的に自然な多様性が維持されると考えられます。
-->

---

# 9. 結果1: 多様性の向上 (語彙数推移)

生成されたテキストに含まれる「ユニーク単語数」の増加を確認

<div class="grid grid-cols-2 gap-4 mt-4 items-start">
  <div class="space-y-3 text-sm">
    <div class="bg-white p-2 rounded shadow-sm border border-gray-100">
      <strong class="text-blue-600 block mb-1">各条件での1000件時点での語彙数の変化</strong>
      <ul class="opacity-80 text-xs pl-4 list-disc leading-tight space-y-1">
        <li><strong>Gemini 3 Flash: +39.0%</strong> (2187→3041)</li>
        <li><strong>GPT-5.2: +31.4%</strong> (3368→4425)</li>
        <li><strong>Gemini 3 Pro: +9.8%</strong> (2680→2943)</li>
        <li><strong>GPT-5 mini: +8.1%</strong> (2651→2867)</li>
      </ul>
    </div>
    <div class="bg-blue-50 p-2 rounded shadow-sm border border-blue-100 text-xs text-blue-900">
      <p><strong>傾向分析:</strong></p>
      <ul class="list-disc pl-4 mt-1 leading-tight">
        <li>RAG OFFは後半にかけて増加量が逓減（同じ単語の使い回し）。</li>
        <li>RAG ONは多様性を維持し続けている。</li>
      </ul>
    </div>
  </div>
  <div class="flex items-center justify-center">
    <img src="/figure/vocabulary_growth_comparison.png" alt="Graph" class="h-auto max-h-[350px] object-contain shadow-md rounded" />
  </div>
</div>

<!--
ここから結果について述べます。
まず、生成されたテキストに含まれる「ユニーク単語数」の増加推移です。

グラフの点線がRAG OFF、実線がRAG ONの場合です。
RAG OFFは後半にかけて傾きが緩やかになり、語彙が飽和、つまり同じような言葉や設定を使い回しています。

一方、RAG ONの場合は右肩上がりの傾向を維持しており、常に新しい語彙が生み出されています。
特に効果が顕著だったGemini 3 Flashでは39.0%、GPT-5.2では31.4%の語彙増加が確認できました。
-->

---

# 10. 結果2: 重複の抑制 (ベクトル類似度)

生成された社会的シナリオおよび各エンティティ（User, Project, Item）の**全プロパティ**結合テキスト間のコサイン類似度分布を比較。

<div class="grid grid-cols-2 gap-4 mt-2 items-start">
  <div class="text-sm">
    <table class="w-full text-xs border-collapse mb-0">
      <thead class="bg-gray-100">
        <tr>
          <th class="p-1 border">モデル</th>
          <th class="p-1 border">平均(OFF→ON)</th>
          <th class="p-1 border">差分</th>
          <th class="p-1 border">Cohen's d</th>
        </tr>
      </thead>
      <tbody>
        <tr>
          <td class="p-1 border font-bold">GPT-5.2</td>
          <td class="p-1 border">0.806 → 0.785</td>
          <td class="p-1 border font-bold text-red-600">-0.020</td>
          <td class="p-1 border font-bold text-red-600">-0.51</td>
        </tr>
        <tr>
          <td class="p-1 border">GPT-5 Mini</td>
          <td class="p-1 border">0.802 → 0.786</td>
          <td class="p-1 border">-0.016</td>
          <td class="p-1 border">-0.40</td>
        </tr>
        <tr>
          <td class="p-1 border">Gemini 3 Flash</td>
          <td class="p-1 border">0.783 → 0.767</td>
          <td class="p-1 border">-0.017</td>
          <td class="p-1 border">-0.39</td>
        </tr>
        <tr>
          <td class="p-1 border">Gemini 3 Pro</td>
          <td class="p-1 border">0.771 → 0.770</td>
          <td class="p-1 border">-0.001</td>
          <td class="p-1 border">-0.01</td>
        </tr>
      </tbody>
    </table>
  </div>
  <div class="flex items-center justify-center">
    <img src="/figure/similarity_distribution_grid_v2.png" alt="Grid" class="h-auto max-h-[250px] object-contain shadow-md rounded" />
  </div>
</div>

<div class="bg-gray-50 p-3 rounded border border-gray-200 text-xs mt-4">
  <ul class="list-disc pl-4 space-y-1">
    <li><strong>結果:</strong> <strong>GPT-5.2 (Cohen's d=0.51)</strong> を筆頭に、Gemini 3 Proを除く全モデルで <strong>明確な分布の左方シフト（類似度低下）</strong> を確認。</li>
    <li><strong>考察:</strong> 全文を用いたより詳細な比較において、RAGによる「既出回避」の効果が強く表れた。</li>
  </ul>
</div>

<!--
次に、生成されたデータの全ペアのコサイン類似度の分布について分析しました。
これは、シナリオと各エンティティのすべてのプロパティ（タイトルや説明文など）をエンベディングして比較したものです。

表と右側のグラフをご覧ください。
GPT-5.2など、Gemini 3 Proを除く3つのモデルで類似度が低下し、分布が左方へシフトしました。
これは、RAGによって「過去と同じような設定」が避けられたことを示しています。

特にGPT-5.2ではCohen's dが0.51と最も大きく、RAGの効果が顕著に現れました。Gemini 3 Flashでも0.39と大きな効果が出ています。
Gemini 3 Proだけは変化が見られませんでしたが、これは元々多様性が高かったためと考えられます。
-->

---

# 11. 結果3: LLMによる品質評価

Gemini 3 Pro を用いて**シナリオと構造化データ**の両方を評価

<div class="grid grid-cols-[1.1fr_1.1fr] gap-4 mt-2 h-[80%]">
  <!-- Left: Score Table (Compact) -->
  <div class="text-[9px]">
    <h3 class="font-bold border-b border-gray-300 mb-1">定性スコア (5段階)</h3>
    <table class="w-full border-collapse">
      <thead class="bg-gray-100">
        <tr>
          <th class="p-0.5 border">Model</th>
          <th class="p-0.5 border">RAG</th>
          <th class="p-0.5 border">Coherence</th>
          <th class="p-0.5 border">Specificity</th>
          <th class="p-0.5 border">Human</th>
        </tr>
      </thead>
      <tbody>
        <tr class="bg-blue-50">
          <td class="p-0.5 border font-bold" rowspan="2">GPT-5 Mini</td>
          <td class="p-0.5 border text-gray-500">OFF</td>
          <td class="p-0.5 border">5.00</td>
          <td class="p-0.5 border">4.75</td>
          <td class="p-0.5 border">4.15</td>
        </tr>
        <tr class="bg-blue-50">
          <td class="p-0.5 border font-bold text-blue-600">ON</td>
          <td class="p-0.5 border">5.00</td>
          <td class="p-0.5 border">4.95</td>
          <td class="p-0.5 border">4.30</td>
        </tr>
        <tr>
          <td class="p-0.5 border font-bold" rowspan="2">Gemini 3 Flash</td>
          <td class="p-0.5 border text-gray-500">OFF</td>
          <td class="p-0.5 border">5.00</td>
          <td class="p-0.5 border">5.00</td>
          <td class="p-0.5 border">4.75</td>
        </tr>
        <tr>
          <td class="p-0.5 border font-bold text-blue-600">ON</td>
          <td class="p-0.5 border">5.00</td>
          <td class="p-0.5 border">5.00</td>
          <td class="p-0.5 border font-bold text-blue-600">4.95</td>
        </tr>
        <tr class="bg-blue-50">
          <td class="p-0.5 border" rowspan="2">GPT-5.2</td>
          <td class="p-0.5 border text-gray-500">OFF</td>
          <td class="p-0.5 border">5.00</td>
          <td class="p-0.5 border">5.00</td>
          <td class="p-0.5 border">5.00</td>
        </tr>
        <tr class="bg-blue-50">
          <td class="p-0.5 border">ON</td>
          <td class="p-0.5 border">5.00</td>
          <td class="p-0.5 border">5.00</td>
          <td class="p-0.5 border">4.95</td>
        </tr>
         <tr class="">
          <td class="p-0.5 border" rowspan="2">Gemini 3 Pro</td>
          <td class="p-0.5 border text-gray-500">OFF</td>
          <td class="p-0.5 border">5.00</td>
          <td class="p-0.5 border">5.00</td>
          <td class="p-0.5 border">5.00</td>
        </tr>
        <tr class="">
          <td class="p-0.5 border">ON</td>
          <td class="p-0.5 border">4.95</td>
          <td class="p-0.5 border">5.00</td>
          <td class="p-0.5 border">5.00</td>
        </tr>
      </tbody>
    </table>
  </div>

  <!-- Right: Qualitative Feedback Example -->
  <div class="flex flex-col">
    <h3 class="font-bold border-b border-gray-300 mb-2 text-sm">定性評価の例</h3>
    <div class="bg-gray-50 p-3 rounded border border-gray-200 text-xs leading-relaxed flex-grow">
      <div class="text-[10px] text-gray-500 mb-1">テーマ: 架空の部族・未発見文明の『偽造遺物』制作研究会</div>
      <p class="italic text-gray-700">
        「『架空の遺物』というテーマに対し、架空の伝承（Lore）と現実の制作技法（Real）が見事に融合しており、整合性が非常に高い。<br><br>
        素材名（石粉粘土、ひび割れメディウム、ラブラドライト等）や加工法（紅茶染め、強制緑青）が極めて具体的。<br><br>
        また、ユーザーのプロフィールやアイテム解説の文体に、このジャンル特有の『設定遊び』を楽しむ熱量とこだわりが感じられ、非常に人間味がある。」
      </p>
      <div class="mt-2 text-right font-bold text-blue-600 text-[10px]">- Gemini 3 Pro (Judge)</div>
    </div>
  </div>
</div>

<!--
続いて、LLMによる品質評価の結果です。
Gemini 3 Proを審査員として、生成されたシナリオと構造化データの両方について、整合性・具体性・人間らしさの3観点で評価を行いました。

左側の表は定性スコアです。
全てのモデルで「整合性」はほぼ満点であり、上位モデルでは「人間らしさ」なども高い評価を得ています。

右側は、審査員LLMが出力した実際の講評（Reason）の例です。
「架空の伝承と現実の技法が融合している」「素材名や加工法が極めて具体的」といったように、シナリオの設定だけでなく、実データとしての具体性まで深く読み取った上で評価されていることがわかります。
-->

---

# 12. 定性評価: 生成されたシナリオの実例

RAG ON (GPT-5.2) が生成した「夜間大学・無線同好会」の例。

<div class="mt-2 text-[9px] leading-tight">
  <!-- Cluster: Organization Theme -->
  <div class="mb-2 bg-gray-50 p-1.5 rounded border border-gray-200">
    <strong class="text-[10px] text-gray-800 block mb-0.5">Cluster Theme (Organization)</strong>
    <p class="text-gray-700 leading-normal">夜間大学の「電波観測・自作アンテナ同好会」が運営する、都市電波ノイズの“見える化”ガジェット共同制作組織</p>
  </div>

  <div class="grid grid-cols-3 gap-2">
    <!-- Users Column -->
    <div class="space-y-1.5">
      <h4 class="font-bold text-blue-700 border-b border-blue-200 mb-1 pb-0.5 text-[10px]">Users (Roles)</h4>  
      <div class="bg-blue-50 p-1.5 rounded border border-blue-100 shadow-sm">
        <strong class="text-blue-800 block mb-0.5">霧島えみ (LEADER)</strong>
        <p class="opacity-90 leading-tight">夜間大学の社会人学生。SDRと自作アンテナを社会に接続したい。「都市のノイズは見えない公害」として可視化を推進。</p>
      </div>
      <div class="bg-white p-1.5 rounded border border-gray-200 shadow-sm relative">
        <strong class="text-gray-800 block mb-0.5">矢木拓真 (MEMBER)</strong>
        <p class="opacity-80 leading-tight">金属加工屋。アンテナの「曲げ」と「固定」の沼担当。現場で使える形に落とすのが得意。</p>
      </div>
      <div class="bg-white p-1.5 rounded border border-gray-200 shadow-sm relative">
        <strong class="text-gray-800 block mb-0.5">水瀬ナオ (MEMBER)</strong>
        <p class="opacity-80 leading-tight">DSP/組込み担当。ノイズの“気配”をUIに落とす役。法規とリテラシーの説明も担当。</p>
      </div>
    </div>
    <!-- Projects Column -->
    <div class="space-y-1.5">
      <h4 class="font-bold text-green-700 border-b border-green-200 mb-1 pb-0.5 text-[10px]">Projects (Context)</h4>
      <div class="bg-green-50 p-1.5 rounded border border-green-100 shadow-sm h-[70px]">
        <div class="flex justify-between items-start mb-0.5">
          <strong class="text-green-800 truncate text-[8.5px]">都市電波ノイズ可視化マップ</strong>
        </div>
        <p class="opacity-90 leading-tight line-clamp-3">街の中で増え続けるノイズを測って・比べて・説明できる形にする。法規・電波リテラシーを重視。</p>
      </div>
      <div class="bg-green-50 p-1.5 rounded border border-green-100 shadow-sm h-[70px] relative">
        <div class="flex justify-between items-start mb-0.5">
          <strong class="text-green-800 truncate text-[8.5px]">アンテナ共同制作</strong>
        </div>
        <p class="opacity-90 leading-tight line-clamp-3">「作例」で終わらせず、測定と係数までセットにして共有。同じ治具・寸法で作る。</p>
      </div>
    </div>
    <!-- Items Column -->
    <div class="space-y-1.5">
      <h4 class="font-bold text-yellow-700 border-b border-yellow-200 mb-1 pb-0.5 text-[10px]">Items (Products)</h4>
      <div class="bg-white p-1.5 rounded border border-gray-200 shadow-sm h-[70px]">
        <strong class="text-gray-800 block truncate mb-0.5">ウォーターフォールUIパック</strong>
        <p class="opacity-80 leading-tight line-clamp-3">夜間観測用テーマ＋ログ出力設定。可視化は派手さよりも「比較できる」ことが重要。</p>
      </div>
      <div class="bg-white p-1.5 rounded border border-gray-200 shadow-sm h-[70px]">
        <strong class="text-yellow-800 block truncate mb-0.5">小型UHF八木アンテナ</strong>
        <p class="opacity-90 leading-tight line-clamp-3">方向でノイズを読む。組立治具データ付き。ノイズフロアの持ち上がりを見比べる。</p>
      </div>
      <div class="bg-white p-1.5 rounded border border-gray-200 shadow-sm h-[70px]">
        <strong class="text-gray-800 block truncate mb-0.5">共同校正ログテンプレ</strong>
        <p class="opacity-80 leading-tight line-clamp-3">観測条件・匿名化・再現性のための記録シート。“同じものさし”で測る。</p>
      </div>
    </div>
  </div>
</div>

<div class="mt-2 p-2 bg-gray-100 rounded text-xs border-l-4 border-gray-400">
  <strong>評価:</strong> 「ただアンテナを売る」のではなく、<strong>「共同校正」や「法規リテラシー」</strong>まで設定されている。<br>
  単なる属性データの羅列ではなく、<strong>「都市ノイズの可視化」という明確な目的と文脈（リレーション）</strong>を持ったシナリオが生成された。
</div>

<!--
実際に生成されたシナリオの具体例です。
これは「夜間大学の無線同好会」という設定の一部を抜粋したものです。

単に「アンテナを作る」だけでなく、「都市ノイズを可視化する」という明確な目的があり、そのために「共同校正」や「法規リテラシー」といった詳細な背景が設定されています。

このように、社会的シナリオとしての深みとリアリティを持ったデータが生成されました。
-->

---

# 13. まとめと今後の展望

<div class="grid grid-cols-2 gap-4 mt-2 h-[80%]">
  <!-- Left Column: Summary -->
  <div class="flex flex-col gap-3">
    <!-- Results -->
    <div class="bg-blue-50 p-3 rounded-lg border-l-4 border-blue-600 shadow-sm flex-1 flex flex-col justify-center">
      <div class="flex items-center gap-2 mb-1">
        <div class="text-xl text-blue-600"><carbon:result /></div>
        <h3 class="font-bold text-blue-800 text-sm">成果</h3>
      </div>
      <ul class="list-disc pl-4 space-y-1 text-xs text-gray-700 leading-tight">
        <li><strong>LLMデータ生成エージェントの構築</strong><br>
          <span class="text-[10px] opacity-80">複雑なリレーションを持つWebシステムのテストデータ生成手法を提案・実証。</span>
        </li>
        <li><strong>多様性と品質の両立</strong><br>
          <span class="text-[10px] opacity-80">記憶機構(RAG)により設定の重複を回避しつつ、高品質なデータを生成可能。</span>
        </li>
      </ul>
    </div>
    <!-- Significance -->
    <div class="bg-green-50 p-3 rounded-lg border-l-4 border-green-600 shadow-sm flex-1 flex flex-col justify-center">
      <div class="flex items-center gap-2 mb-1">
        <div class="text-xl text-green-600"><carbon:idea /></div>
        <h3 class="font-bold text-green-800 text-sm">意義</h3>
      </div>
      <ul class="list-disc pl-4 space-y-1 text-xs text-gray-700 leading-tight">
        <li><strong>「社会的シナリオ」の即時用意</strong><br>
          <span class="text-[10px] opacity-80">開発初期段階でも実運用に近いテストが可能に。</span>
        </li>
        <li><strong>検証精度の向上</strong><br>
          <span class="text-[10px] opacity-80">文脈を持つデータにより、検索アルゴリズムやUI/UXの検証深度が大幅に向上する。</span>
        </li>
      </ul>
    </div>
  </div>
  <!-- Right Column: Future Work -->
  <div class="flex flex-col gap-3">
    <!-- Application -->
    <div class="flex flex-col p-3 bg-white rounded-lg border-l-4 border-indigo-500 shadow-sm flex-1 border border-gray-100 justify-center">
      <div class="flex items-center gap-2 mb-1">
        <div class="text-xl text-indigo-500"><carbon:application-web /></div>
        <h3 class="font-bold text-indigo-800 text-sm">実践的な機能開発への応用</h3>
      </div>
      <p class="text-xs text-gray-700 leading-relaxed">
        生成された「社会的シナリオデータ」を活用し、<strong>高度な検索システム</strong>や、個人の嗜好に合った<strong>レコメンデーションエンジン</strong>を実際に開発・評価する。
      </p>
    </div>
    <!-- Generalization -->
    <div class="flex flex-col p-3 bg-white rounded-lg border-l-4 border-purple-500 shadow-sm flex-1 border border-gray-100 justify-center">
      <div class="flex items-center gap-2 mb-1">
        <div class="text-xl text-purple-500"><carbon:model-alt /></div>
        <h3 class="font-bold text-purple-800 text-sm">フレームワークの一般化</h3>
      </div>
      <p class="text-xs text-gray-700 leading-relaxed">
        今回は特定のプラットフォームに特化したが、このアーキテクチャを<strong>任意のドメインやプラットフォーム</strong>で適用可能な汎用フレームワークとして体系化する。
      </p>
    </div>
  </div>
</div>

<!--
まとめです。
本研究では、1点物プラットフォームの検証に必要なテストデータを、LLMエージェントによって生成する手法を提案しました。
1000件規模の生成実験の結果、記憶機構（RAG）によって全体としての設定の重複を防ぎつつ、個別のデータとしても具体的でリアリティのある品質を維持できることが確認されました。

これにより、学習データのない開発初期段階においても、実運用に近い「社会的シナリオのあるデータ」を用意することが可能になり、検索システムやUIの検証精度を大幅に向上させることができます。

最後に今後の展望です。
まずは、今回生成された「社会的シナリオデータ」を活用し、実際に高度な検索システムやレコメンデーションエンジンを開発・評価することで、本手法の実践的な有用性を確認したいと考えています。
また、このデータ生成アーキテクチャを、他のプラットフォームにも適用可能な汎用フレームワークへと発展させることも目指します。

以上で発表を終わります。ご清聴ありがとうございました。
-->

---

# ご清聴ありがとうございました
