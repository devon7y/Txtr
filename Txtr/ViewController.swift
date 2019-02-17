//
//  ViewController.swift
//  Txtr
//
//  Created by Devon Yanitski on 2019-01-05.
//  Copyright © 2019 Devon Yanitski. All rights reserved.
//

import UIKit
import SpriteKit
import GameplayKit

// IDEA: Make players final score = scoreLabel * timerLabel

class ViewController: UIViewController, UITextFieldDelegate {
    var game: GameScene!
    
    @IBOutlet weak var placeholderTextField: UITextField!
    @IBOutlet weak var blurView: UIVisualEffectView!
    @IBOutlet weak var textField: UITextField!
    @IBOutlet weak var scoreBlurBackground: UIVisualEffectView!
    @IBOutlet weak var scoreLabel: UILabel!
    @IBOutlet weak var timerBlurBackground: UIVisualEffectView!
    @IBOutlet weak var gameView: SKView!
    @IBOutlet weak var keyboardView: UIView!
    
    @IBOutlet weak var timerLabel: UILabel!
    
    @IBOutlet weak var startButton: UIButton!
    @IBOutlet weak var outputLabel: UILabel!
    @IBOutlet weak var placeholderLabel: UILabel!
    
    @IBOutlet var letterKeys: [UIButton]!
    @IBOutlet var otherKeys: [UIButton]!
    
    var keyboardOutput = [String]()
    
    var textMessages = ["Cat", "Dog", "Racoon", "Snake", "Cow", "Monkey", "Bear", "Buffalo", "Moose", "Whale", "Girrafe", "Trout", "Worm", "Mouse", "Jonnie", "Dolphin", "Deer", "Pig", "Rhynosourous", "Chicken", "Shark", "Blobfish", "Robin", "Mockingbird", "Spirit Bear",  "Stratiomyidae"]
    
    var unusedMessages = ["I'm almost there", "Can't talk now, I'm driving", "Text you later", "I'm driving right now", "I'll call you back later, I'm driving"]
    
    var currentMesssage = 0
    
    var playerPoints = 0
    
    var seconds = 5
    var timer = Timer()
    var isTimerRunning = false
    
    var capitalIsToggled = false
    
    override func viewDidLoad() {
        super.viewDidLoad()
        
        self.textField.delegate = self
        textField.becomeFirstResponder()
//        textField.attributedPlaceholder = NSAttributedString(string: "Placeholder Text", attributes: [NSAttributedString.Key.foregroundColor : #colorLiteral(red: 0.5, green: 0.5, blue: 0.5, alpha: 1)])
//        
        timerBlurBackground.layer.cornerRadius = 10
        timerBlurBackground.clipsToBounds = true
        scoreBlurBackground.layer.cornerRadius = 10
        scoreBlurBackground.clipsToBounds = true
        
        if let view = gameView {
            // Load the SKScene from 'GameScene.sks'
            if let scene = SKScene(fileNamed: "GameScene") {
                // Set the scale mode to scale to fit the window
                scene.scaleMode = .aspectFill
                game = scene as? GameScene
                game.viewController = self
                // Present the scene
                view.presentScene(scene)
            }
            
            view.ignoresSiblingOrder = true
            
            view.showsFPS = false
            view.showsNodeCount = false
            view.showsPhysics = false
        }
        
        let swipeRight = UISwipeGestureRecognizer(target: self, action: #selector(self.respondToSwipeGesture))
        swipeRight.direction = .right
        blurView.addGestureRecognizer(swipeRight)
        
        let swipeLeft = UISwipeGestureRecognizer(target: self, action: #selector(self.respondToSwipeGesture))
        swipeRight.direction = .left
        blurView.addGestureRecognizer(swipeLeft)
        
        for key in letterKeys {
            key.layer.cornerRadius = 5
            key.clipsToBounds = true
        }
        for key in otherKeys {
            key.layer.cornerRadius = 5
            key.clipsToBounds = true
        }
    }
    
    @IBAction func startButtonTapped(_ sender: UIButton) {
        startGame()
    }
    
    func startGame() {
        if isTimerRunning == false {
            runTimer()
            game.startGame()
            self.startButton.isHidden = true
            placeholderTextField.text = textMessages[currentMesssage]
        }
    }
    
    func runTimer() {
        timer = Timer.scheduledTimer(timeInterval: 1, target: self, selector: (#selector(updateTimer)), userInfo: nil, repeats: true)
        isTimerRunning = true
    }
    
    @objc func updateTimer() {
        if seconds < 1 || game.isGameOver == true {
            timer.invalidate()
            isTimerRunning = false
            placeholderTextField.text = ""
            textField.text = "GAME OVER, YOU SUCK"
            game.gameOver()
//            startButton.isHidden = false
        } else {
            seconds -= 1
            timerLabel.text = "Time: \(seconds)"
            //            timerLabel.text = String(seconds)
            //            labelButton.setTitle(timeString(time: TimeInterval(seconds)), for: UIControlState.normal)
        }
    }
    
    func checkIfCorrect() {
        
        if textField.text == placeholderTextField.text {
            outputLabel.textColor = #colorLiteral(red: 0.4666666687, green: 0.7647058964, blue: 0.2666666806, alpha: 1)
            // wait...
            textField.text = ""
            keyboardOutput.removeAll()
            textField.textColor = #colorLiteral(red: 1, green: 1, blue: 1, alpha: 1)
            currentMesssage += 1
            playerPoints += 1
            scoreLabel.text = "Points: \(playerPoints)"
            print("Player Points: \(playerPoints)")
            placeholderTextField.text = textMessages[currentMesssage]
            
            if isTimerRunning == true {
                seconds += 5
                timerLabel.text = "Time: \(seconds)"
            }
        } else {
            textField.textColor = #colorLiteral(red: 0.9254902005, green: 0.2352941185, blue: 0.1019607857, alpha: 1)
        }
    }
    
    override var shouldAutorotate: Bool {
        return true
    }
    
    override var supportedInterfaceOrientations: UIInterfaceOrientationMask {
        if UIDevice.current.userInterfaceIdiom == .phone {
            return .allButUpsideDown
        } else {
            return .all
        }
    }
    
    override var prefersStatusBarHidden: Bool {
        return true
    }
    
    
    
    @IBAction func leftButtonPressed(_ sender: Any) {
        game.changeToLeftLane()
    }
    
    @IBAction func rightButtonPressed(_ sender: Any) {
        game.changeToRightLane()
    }
    
    
    
    
    
    
    
    @objc func respondToSwipeGesture(gesture: UIGestureRecognizer) {
        if let swipeGesture = gesture as? UISwipeGestureRecognizer {
            switch swipeGesture.direction {
            case UISwipeGestureRecognizer.Direction.right:
                game.changeToRightLane()
            case UISwipeGestureRecognizer.Direction.left:
                game.changeToLeftLane()
            default:
                break
            }
        }
    }
    
    func capitalizeLettersIfNeeded() {
        for key in letterKeys {
            if capitalIsToggled == true {
                UIView.performWithoutAnimation {
                    key.setTitle("\(key.titleLabel!.text!.uppercased())", for: .normal)
                    key.layoutIfNeeded()
                }
            } else {
                UIView.performWithoutAnimation {
                    key.setTitle("\(key.titleLabel!.text!.lowercased())", for: .normal)
                    key.layoutIfNeeded()
                }
                
            }
        }
    }
    
    
    
    func textFieldShouldReturn(_ textField: UITextField) -> Bool {
        
        checkIfCorrect()
        return true
    }
    
    
    @IBAction func qKeyPressed(_ sender: Any) {
        if capitalIsToggled == true {
            keyboardOutput.append("Q")
            capitalIsToggled.toggle()
            capitalizeLettersIfNeeded()
        } else {
            keyboardOutput.append("q")
        }
        outputLabel.text = "\(keyboardOutput.joined())"
    }
    @IBAction func wKeyPressed(_ sender: Any) {
        if capitalIsToggled == true {
            keyboardOutput.append("W")
            capitalIsToggled.toggle()
            capitalizeLettersIfNeeded()
        } else {
            keyboardOutput.append("w")
        }
        outputLabel.text = "\(keyboardOutput.joined())"
    }
    @IBAction func eKeyPressed(_ sender: Any) {
        if capitalIsToggled == true {
            keyboardOutput.append("E")
            capitalIsToggled.toggle()
            capitalizeLettersIfNeeded()
        } else {
            keyboardOutput.append("e")
        }
        outputLabel.text = "\(keyboardOutput.joined())"
    }
    @IBAction func rKeyPressed(_ sender: Any) {
        if capitalIsToggled == true {
            keyboardOutput.append("R")
            capitalIsToggled.toggle()
            capitalizeLettersIfNeeded()
        } else {
            keyboardOutput.append("r")
        }
        outputLabel.text = "\(keyboardOutput.joined())"
    }
    @IBAction func tKeyPressed(_ sender: Any) {
        if capitalIsToggled == true {
            keyboardOutput.append("T")
            capitalIsToggled.toggle()
            capitalizeLettersIfNeeded()
        } else {
            keyboardOutput.append("t")
        }
        outputLabel.text = "\(keyboardOutput.joined())"
    }
    @IBAction func yKeyPressed(_ sender: Any) {
        if capitalIsToggled == true {
            keyboardOutput.append("Y")
            capitalIsToggled.toggle()
            capitalizeLettersIfNeeded()
        } else {
            keyboardOutput.append("y")
        }
        outputLabel.text = "\(keyboardOutput.joined())"
    }
    @IBAction func uKeyPressed(_ sender: Any) {
        if capitalIsToggled == true {
            keyboardOutput.append("U")
            capitalIsToggled.toggle()
            capitalizeLettersIfNeeded()
        } else {
            keyboardOutput.append("u")
        }
        outputLabel.text = "\(keyboardOutput.joined())"
    }
    @IBAction func iKeyPressed(_ sender: Any) {
        if capitalIsToggled == true {
            keyboardOutput.append("I")
            capitalIsToggled.toggle()
            capitalizeLettersIfNeeded()
        } else {
            keyboardOutput.append("i")
        }
        outputLabel.text = "\(keyboardOutput.joined())"
    }
    @IBAction func oKeyPressed(_ sender: Any) {
        if capitalIsToggled == true {
            keyboardOutput.append("O")
            capitalIsToggled.toggle()
            capitalizeLettersIfNeeded()
        } else {
            keyboardOutput.append("o")
        }
        outputLabel.text = "\(keyboardOutput.joined())"
    }
    @IBAction func pKeyPressed(_ sender: Any) {
        if capitalIsToggled == true {
            keyboardOutput.append("P")
            capitalIsToggled.toggle()
            capitalizeLettersIfNeeded()
        } else {
            keyboardOutput.append("p")
        }
        outputLabel.text = "\(keyboardOutput.joined())"
    }
    @IBAction func aKeyPressed(_ sender: Any) {
        if capitalIsToggled == true {
            keyboardOutput.append("A")
            capitalIsToggled.toggle()
            capitalizeLettersIfNeeded()
        } else {
            keyboardOutput.append("a")
        }
        outputLabel.text = "\(keyboardOutput.joined())"
    }
    @IBAction func sKeyPressed(_ sender: Any) {
        if capitalIsToggled == true {
            keyboardOutput.append("S")
            capitalIsToggled.toggle()
            capitalizeLettersIfNeeded()
        } else {
            keyboardOutput.append("s")
        }
        outputLabel.text = "\(keyboardOutput.joined())"
    }
    @IBAction func dKeyPressed(_ sender: Any) {
        if capitalIsToggled == true {
            keyboardOutput.append("D")
            capitalIsToggled.toggle()
            capitalizeLettersIfNeeded()
        } else {
            keyboardOutput.append("d")
        }
        outputLabel.text = "\(keyboardOutput.joined())"
    }
    @IBAction func fKeyPressed(_ sender: Any) {
        if capitalIsToggled == true {
            keyboardOutput.append("F")
            capitalIsToggled.toggle()
            capitalizeLettersIfNeeded()
        } else {
            keyboardOutput.append("f")
        }
        outputLabel.text = "\(keyboardOutput.joined())"
    }
    @IBAction func gKeyPressed(_ sender: Any) {
        if capitalIsToggled == true {
            keyboardOutput.append("G")
            capitalIsToggled.toggle()
            capitalizeLettersIfNeeded()
        } else {
            keyboardOutput.append("g")
        }
        outputLabel.text = "\(keyboardOutput.joined())"
    }
    @IBAction func hKeyPressed(_ sender: Any) {
        if capitalIsToggled == true {
            keyboardOutput.append("H")
            capitalIsToggled.toggle()
            capitalizeLettersIfNeeded()
        } else {
            keyboardOutput.append("h")
        }
        outputLabel.text = "\(keyboardOutput.joined())"
    }
    @IBAction func jKeyPressed(_ sender: Any) {
        if capitalIsToggled == true {
            keyboardOutput.append("J")
            capitalIsToggled.toggle()
            capitalizeLettersIfNeeded()
        } else {
            keyboardOutput.append("j")
        }
        outputLabel.text = "\(keyboardOutput.joined())"
    }
    @IBAction func kKeyPressed(_ sender: Any) {
        if capitalIsToggled == true {
            keyboardOutput.append("K")
            capitalIsToggled.toggle()
            capitalizeLettersIfNeeded()
        } else {
            keyboardOutput.append("k")
        }
        outputLabel.text = "\(keyboardOutput.joined())"
    }
    @IBAction func lKeyPressed(_ sender: Any) {
        if capitalIsToggled == true {
            keyboardOutput.append("L")
            capitalIsToggled.toggle()
            capitalizeLettersIfNeeded()
        } else {
            keyboardOutput.append("l")
        }
        outputLabel.text = "\(keyboardOutput.joined())"
    }
    @IBAction func capitalizeKeyPressed(_ sender: Any) {
        capitalIsToggled.toggle()
        capitalizeLettersIfNeeded()
    }
    @IBAction func zKeyPressed(_ sender: Any) {
        if capitalIsToggled == true {
            keyboardOutput.append("Z")
            capitalIsToggled.toggle()
            capitalizeLettersIfNeeded()
        } else {
            keyboardOutput.append("z")
        }
        outputLabel.text = "\(keyboardOutput.joined())"
    }
    @IBAction func xKeyPressed(_ sender: Any) {
        if capitalIsToggled == true {
            keyboardOutput.append("X")
            capitalIsToggled.toggle()
            capitalizeLettersIfNeeded()
        } else {
            keyboardOutput.append("x")
        }
        outputLabel.text = "\(keyboardOutput.joined())"
    }
    @IBAction func cKeyPressed(_ sender: Any) {
        if capitalIsToggled == true {
            keyboardOutput.append("C")
            capitalIsToggled.toggle()
            capitalizeLettersIfNeeded()
        } else {
            keyboardOutput.append("c")
        }
        outputLabel.text = "\(keyboardOutput.joined())"
    }
    @IBAction func vKeyPressed(_ sender: Any) {
        if capitalIsToggled == true {
            keyboardOutput.append("V")
            capitalIsToggled.toggle()
            capitalizeLettersIfNeeded()
        } else {
            keyboardOutput.append("v")
        }
        outputLabel.text = "\(keyboardOutput.joined())"
    }
    @IBAction func bKeyPressed(_ sender: Any) {
        if capitalIsToggled == true {
            keyboardOutput.append("B")
            capitalIsToggled.toggle()
            capitalizeLettersIfNeeded()
        } else {
            keyboardOutput.append("b")
        }
        outputLabel.text = "\(keyboardOutput.joined())"
    }
    @IBAction func nKeyPressed(_ sender: Any) {
        if capitalIsToggled == true {
            keyboardOutput.append("N")
            capitalIsToggled.toggle()
            capitalizeLettersIfNeeded()
        } else {
            keyboardOutput.append("n")
        }
        outputLabel.text = "\(keyboardOutput.joined())"
    }
    @IBAction func mKeyPressed(_ sender: Any) {
        if capitalIsToggled == true {
            keyboardOutput.append("M")
            capitalIsToggled.toggle()
            capitalizeLettersIfNeeded()
        } else {
            keyboardOutput.append("m")
        }
        outputLabel.text = "\(keyboardOutput.joined())"
    }
    @IBAction func backspaceKeyPressed(_ sender: Any) {
        if keyboardOutput.count > 0 {
            keyboardOutput.removeLast()
            outputLabel.text = "\(keyboardOutput.joined())"
        } else {
            print("Can't remove last item.")
        }
    }
    @IBAction func numbersKeyPressed(_ sender: Any) {
        keyboardOutput.append("*NUMBERS*")
        outputLabel.text = "\(keyboardOutput.joined())"
    }
    @IBAction func emojisKeyPressed(_ sender: Any) {
        keyboardOutput.append("*EMOJI*")
        outputLabel.text = "\(keyboardOutput.joined())"
    }
    @IBAction func microphoneKeyPressed(_ sender: Any) {
        keyboardOutput.append("*MICROPHONE*")
        outputLabel.text = "\(keyboardOutput.joined())"
    }
    @IBAction func spaceKeyPressed(_ sender: Any) {
        keyboardOutput.append(" ")
        outputLabel.text = "\(keyboardOutput.joined())"
    }
    @IBAction func returnKeyPressed(_ sender: Any) {
        //        keyboardOutput.append("*RETURN*")
        //        outputLabel.text = "\(keyboardOutput.joined())"
        
        checkIfCorrect()
    }
    
    
    
    
    
}

